"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

// Demo: you probably have auth; wire your real user id here.
function getCurrentUserId() {
  // e.g., from session. For demo, hardcode or pass via form.
  return "cmg86g3a60000vobc2o7b7776"; // Test user
}

export async function joinGroup(formData: FormData) {
  const groupId = String(formData.get("groupId") || "");
  const userId  = String(formData.get("userId")  || getCurrentUserId());

  if (!groupId || !userId) throw new Error("Missing groupId or userId");

  await prisma.$transaction(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: groupId },
      select: { capacity: true, currentSize: true },
    });
    if (!group) throw new Error("Group not found");

    if (group.currentSize >= group.capacity) {
      throw new Error("Group is full");
    }

    // Ensure not already a member
    const already = await tx.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (already) return;

    // Create membership and bump counter
    await tx.groupMember.create({ data: { groupId, userId } });
    await tx.group.update({
      where: { id: groupId },
      data: { currentSize: { increment: 1 } },
    });
  });

  revalidatePath("/groups");
}
