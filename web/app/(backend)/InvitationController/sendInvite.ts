// app/(backend)/InvitationController/sendInvite.ts
"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/requireUser";

type InviteResult =
  | { ok: true; invitedUsername: string; inviteId: string; message: string }
  | { ok: false; error: string };

//Helper function to get user-friendly error messages
function getInviteErrorMessage(error: string, groupName?: string, username?: string): string {
  const messages: Record<string, string> = {
    "missing-fields": "Please provide both a group and username.",
    "group-not-found": "Group not found.",
    "forbidden": "You don't have permission to invite users to this group.",
    "group-closed": `Unable to send invite as "${groupName}" is closed to new members.`,
    "group-full": `Unable to send invite as "${groupName}" is full (cannot accept more members).`,
    "user-not-found": `User "${username}" not found. Please check the username and try again.`,
    "cannot-invite-self": "You cannot invite yourself to a group.",
    "already-member": `"${username}" is already a member of "${groupName}".`,
    "invite-already-sent": `An invitation has already been sent to "${username}" for "${groupName}".`,
    "internal-error": "An unexpected error occurred. Please try again."
  };
  
  return messages[error] || "An unexpected error occurred.";
}

export async function sendInvite(formData: FormData): Promise<InviteResult> {
  try {
    const me = await requireUser(); 

    const groupId = String(formData.get("groupId") ?? "");
    const receiverUsername = String(formData.get("receiverUsername") ?? "").trim();

    if (!groupId || !receiverUsername) {
      return { 
        ok: false, 
        error: getInviteErrorMessage("missing-fields") 
      };
    }

    //Look up receiver by username FIRST
    const receiver = await prisma.user.findUnique({
      where: { username: receiverUsername },
      select: { id: true, username: true },
    });
    
    if (!receiver) {
      return { 
        ok: false, 
        error: getInviteErrorMessage("user-not-found", undefined, receiverUsername) 
      };
    }
    
    if (receiver.id === me.id) {
      return { 
        ok: false, 
        error: getInviteErrorMessage("cannot-invite-self") 
      };
    }

    //Load group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        isClosed: true,
        capacity: true,
        currentSize: true,
        hostId: true,
        visibility: true,
        members: { 
          select: { 
            userId: true 
          } 
        },
      },
    });
    
    if (!group) {
      return { 
        ok: false, 
        error: getInviteErrorMessage("group-not-found") 
      };
    }

    //host can invite to any group, members can only invite to public groups
    const canInvite = 
      me.id === group.hostId || //Host can always invite
      (group.members.some((m) => m.userId === me.id) && group.visibility === true); //Members can only invite to public groups

    if (!canInvite) {
      return { 
        ok: false, 
        error: getInviteErrorMessage("forbidden", group.name) 
      };
    }
    
    //State checks
    if (group.isClosed) {
      return { 
        ok: false, 
        error: getInviteErrorMessage("group-closed", group.name) 
      };
    }
    
    if (group.currentSize >= group.capacity) {
      return { 
        ok: false, 
        error: getInviteErrorMessage("group-full", group.name) 
      };
    }

    //Already member?
    if (group.members.some((m) => m.userId === receiver.id)) {
      return { 
        ok: false, 
        error: getInviteErrorMessage("already-member", group.name, receiver.username) 
      };
    }

    //Check for any existing invite from any sender to this user for this group
    const existingInvite = await prisma.invitation.findFirst({
      where: { 
        receiverId: receiver.id, 
        groupId: group.id,
        // Don't filter by senderId - check for any invite to this user for this group
      },
      select: { id: true, senderId: true },
    });

    if (existingInvite) {
      // If host is trying to re-invite, allow it (overwrite previous invite)
      if (me.id === group.hostId) {
        // Delete the existing invite first
        await prisma.invitation.delete({
          where: { id: existingInvite.id }
        });
        // Also delete the associated notification
        await prisma.notification.deleteMany({
          where: { invitationId: existingInvite.id }
        });
      } else {
        // Non-hosts cannot re-invite
        return { 
          ok: false, 
          error: getInviteErrorMessage("invite-already-sent", group.name, receiver.username) 
        };
      }
    }

    // Create invite + notification in a transaction
    const invite = await prisma.$transaction(async (tx) => {
      const inv = await tx.invitation.create({
        data: {
          senderId: me.id,
          receiverId: receiver.id,
          groupId: group.id,
        },
      });
      
      await tx.notification.create({
        data: {
          userId: receiver.id,
          type: "INVITE_RECEIVED",
          message: `${me.username} has invited you to join "${group.name}".`,
          invitationId: inv.id,
        },
      });
      
      return inv;
    });

    revalidatePath("/inbox");
    
    return { 
      ok: true, 
      invitedUsername: receiver.username, 
      inviteId: invite.id,
      message: `Invitation sent to ${receiver.username} for ${group.name}!` 
    };
    
  } catch (err) {
    console.error("sendInvite error:", err);
    return { 
      ok: false, 
      error: getInviteErrorMessage("internal-error") 
    };
  }
}