"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { leaveNotify } from "../NotificationController/leaveNotify";
import { deleteNotif } from "../NotificationController/deleteNotifs";

// function getCurrentUserId() {
//   // e.g., from session. For demo, hardcode or pass via form.
//   return "cmg87rs3w0002vofsnekwzvyg"; // Test user
// }

export async function leaveGroup(formData: FormData) {
  const groupId = String(formData.get("groupId") || "");
  const userId  = String(formData.get("userId"));

  if (!groupId || !userId) throw new Error("Missing groupId or userId");

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { hostId: true, currentSize: true },
  });
  if (!group) throw new Error("Group not found");

  // Host cannot leave their own group
  if (group.hostId === userId) {
    throw new Error("Hosts cannot leave their own group. Close the group instead.");
  }

  await prisma.$transaction(async (tx) => {
    const membership = await tx.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) return;

    await tx.groupMember.delete({ where: { id: membership.id } });
    await tx.group.update({
      where: { id: groupId },
      data: { currentSize: { decrement: 1 } },
    });
  });

  await leaveNotify(groupId, userId);
  await deleteNotif(userId, groupId);

  revalidatePath("/groups");
}