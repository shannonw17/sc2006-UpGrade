//originally being called from frontend, but resolveConflict calls it from backend also --> added helper function

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/requireUser";
import { rejectNotify } from "../NotificationController/rejectNotify";

//use if called in backend ie. by resolveConflict.ts
export async function rejectInviteById(userId: string, inviteId: string) {
  const invite = await prisma.invitation.findUnique({ where: { id: inviteId } });
  if (!invite) throw new Error("Invitation not found");
  if (invite.receiverId !== userId) throw new Error("Not authorized to reject this invite");
  //if (invite.status !== "PENDING") return { success: false, reason: "Invite not pending" };

  //Delete invitation (and delete any notification referencing it)
  await prisma.$transaction([
    prisma.notification.deleteMany({ where: { invitationId: invite.id } }),
    prisma.invitation.delete({ where: { id: invite.id } }),
  ]);

  //Notify the sender that recipient rejected the invite
  await rejectNotify(invite.senderId, invite.receiverId, invite.groupId);

  revalidatePath("/inbox");
  return { success: true };
}

//use for frontend
export async function rejectInvite(formData: FormData) {
  const user = await requireUser();
  const inviteId = String(formData.get("inviteId") || "");
  if (!inviteId) throw new Error("Missing inviteId");

  return await rejectInviteById(user.id, inviteId);
}
