"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { joinNotify } from "../NotificationController/joinNotify";
import { cancelPending } from "./cancelPending";

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

  return { success: true, message: "Successfully accepted invite and joined group." }; //not sure if message is needed/where it will be displayed
}
