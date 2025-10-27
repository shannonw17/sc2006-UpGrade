"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/requireUser";
import { joinNotify } from "../NotificationController/joinNotify";
import { cancelPending } from "./cancelPending";
import { checkOverlap } from "../ConflictController/checkOverlap";

export async function acceptInvite(formData: FormData) {
  try {
    const user = await requireUser();
    const inviteId = String(formData.get("inviteId") || "");
    
    if (!inviteId) {
      return { success: false, message: "Missing invite ID. Please try again." };
    }

    // Load invitation with group and members
    const invitation = await prisma.invitation.findUnique({
      where: { id: inviteId },
      include: {
        group: {
          include: {
            members: {
              select: { userId: true }
            }
          }
        },
        sender: {
          select: {
            username: true
          }
        }
      }
    });

    if (!invitation) {
      return { success: false, message: "Invitation not found or has expired." };
    }

    if (invitation.receiverId !== user.id) {
      return { success: false, message: "You are not authorized to accept this invitation." };
    }

    const group = invitation.group;
    const groupName = group.name;

    // Check if user is already a member
    const isAlreadyMember = group.members.some(member => member.userId === user.id);
    if (isAlreadyMember) {
      // Clean up the invitation since user is already a member
      await prisma.$transaction([
        prisma.notification.deleteMany({
          where: { invitationId: invitation.id },
        }),
        prisma.invitation.delete({
          where: { id: invitation.id },
        }),
      ]);
      
      revalidatePath("/inbox");
      return { 
        success: true, 
        message: `You are already a member of "${groupName}". The invitation has been removed.` 
      };
    }

    // Check if group is full
    if (group.currentSize >= group.capacity) {
      return { 
        success: false, 
        message: `Unable to accept invite. "${groupName}" is full (${group.currentSize}/${group.capacity} members).` 
      };
    }

    // Check if group is closed
    if (group.isClosed) {
      return { 
        success: false, 
        message: `Unable to accept invite. "${groupName}" is closed to new members.` 
      };
    }

    // Check if group has expired (end time is in the past)
    const now = new Date();
    if (group.end < now) {
      const endDate = group.end.toLocaleString('en-SG', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
      return { 
        success: false, 
        message: `Unable to accept invite. "${groupName}" has expired (ended on ${endDate}).` 
      };
    }

    // Check if group has already started
    if (group.start < now) {
      const startDate = group.start.toLocaleString('en-SG', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
      return { 
        success: false, 
        message: `Unable to accept invite. "${groupName}" has already started (began on ${startDate}).` 
      };
    }

    // Overlap check with specific group names and times
    const overlap = await checkOverlap(user.id, group.id);
    if (overlap.conflict && overlap.conflictingGroup) {
      const conflictingGroup = overlap.conflictingGroup;
      const conflictingGroupName = conflictingGroup.name;
      
      const conflictingGroupTime = `${new Date(conflictingGroup.start).toLocaleString('en-SG', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })} - ${new Date(conflictingGroup.end).toLocaleString('en-SG', {
        hour: 'numeric',
        minute: '2-digit'
      })}`;
      
      const newGroupTime = `${new Date(group.start).toLocaleString('en-SG', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })} - ${new Date(group.end).toLocaleString('en-SG', {
        hour: 'numeric',
        minute: '2-digit'
      })}`;
      
      return { 
        success: false, 
        message: `Unable to accept invite. "${groupName}" (${newGroupTime}) overlaps with your existing group "${conflictingGroupName}" (${conflictingGroupTime}). Please leave "${conflictingGroupName}" first to join "${groupName}".` 
      };
    }

    // Add user to group and clean up invitation
    await prisma.$transaction(async (tx) => {
      // Add user to group members
      await tx.groupMember.create({
        data: {
          userId: user.id,
          groupId: group.id,
        },
      });

      // Update group currentSize
      await tx.group.update({
        where: { id: group.id },
        data: {
          currentSize: {
            increment: 1,
          },
        },
      });

      // Delete the invitation and related notifications
      await tx.notification.deleteMany({
        where: { invitationId: invitation.id },
      });

      await tx.invitation.delete({
        where: { id: invitation.id },
      });

      // Note: Removed the INVITATION_ACCEPTED notification as it's not a valid type
      // The sender will see that the user joined via GROUP_MEMBER_JOINED notification
    });

    // Notify other group members
    await joinNotify(group.id, user.id);

    // Cancel pending invites if group is now full
    await cancelPending(group.id);

    revalidatePath("/inbox");
    revalidatePath("/groups");
    revalidatePath(`/groups/${group.id}`);
    
    return { 
      success: true, 
      message: `Successfully joined "${groupName}"! You can now access the group details and participate in discussions.` 
    };

  } catch (error) {
    console.error("Accept invite error:", error);
    return { 
      success: false, 
      message: "An unexpected error occurred while accepting the invitation. Please try again later." 
    };
  }
}