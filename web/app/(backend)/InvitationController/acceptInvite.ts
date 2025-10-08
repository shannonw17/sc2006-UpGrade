"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/requireUser";
import { joinNotify } from "../NotificationController/joinNotify";
import { cancelPending } from "./cancelPending";
import { checkOverlap } from "../ConflictController/checkOverlap";
import { resolveConflict } from "../ConflictController/resolveConflict";

export async function acceptInvite(formData: FormData) {
  const user = await requireUser();
  const inviteId = String(formData.get("inviteId") || "");
  if (!inviteId) throw new Error("Missing inviteId");

  // load invite + group
  const invite = await prisma.invitation.findUnique({
    where: { id: inviteId },
    include: { group: true },
  });

  if (!invite) throw new Error("Invitation not found");
  if (invite.receiverId !== user.id) throw new Error("Not authorized to accept this invite");
  
  const groupId = invite.group.id;
  const capacity = invite.group.capacity;

  //check for overlap
  const overlap = await checkOverlap(user.id, groupId); //return conflict: Boolean

  if (overlap.conflict && overlap.conflictingGroup) {
    //to prompt user on frontend "This group timing overlaps with Group __. Leave Group __ to join this group?" - 2 options (confirm or cancel) 
    const choice = true; // how to get choice from frontend, assume click confirm sets boolean to true

    await resolveConflict(user.id, overlap.conflictingGroup?.id, groupId, false, true);
    return;
  }

  // Transaction: add member, increment group size, remove invitation, remove invitation notification
  await prisma.$transaction([
    prisma.groupMember.create({
      data: {
        userId: user.id,
        groupId: invite.groupId,
      }, //add user to group
    }),
    prisma.group.update({
      where: { id: invite.groupId },
      data: { currentSize: { increment: 1 } }, 
    }), //update group capacity
    prisma.notification.deleteMany({
      where: { invitationId: invite.id },
    }), //delete relevant invitation notifications in inbox
    prisma.invitation.delete({
      where: { id: invite.id },
    }), //delete invitation from database -> ensure dont appear in user inbox anymore when user load inbox page
  ]);

  // notify all existing members that user joined (excluding the user who joined)
  await joinNotify(invite.group.id, user.id);

  await cancelPending(groupId); //run to delete pending invitation if group capacity becomes full

  revalidatePath("/inbox");
  return { success: true, message: "Successfully accepted invite and joined group." }; //not sure if message is needed/where it will be displayed
}
