"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { rejectNotify } from "../NotificationController/rejectNotify";

export async function rejectInvite(formData: FormData) {
  const user = await requireUser();
  const inviteId = String(formData.get("inviteId") || "");
  if (!inviteId) throw new Error("Missing inviteId");

  const invite = await prisma.invitation.findUnique({ where: { id: inviteId } });
  if (!invite) throw new Error("Invitation not found");
  if (invite.receiverId !== user.id) throw new Error("Not authorized to reject this invite");
  //if (invite.status !== "PENDING") return { success: false, reason: "Invite not pending" };

  // Delete invitation (and delete any notification referencing it)
  await prisma.$transaction([
    prisma.notification.deleteMany({ where: { invitationId: invite.id } }),
    prisma.invitation.delete({ where: { id: invite.id } }),
  ]);

  // Notify the sender that recipient rejected the invite
  await rejectNotify(invite.senderId, invite.receiverId, invite.groupId);

  return { success: true };
}
