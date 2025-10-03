"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

// Demo: you probably have auth; wire your real user id here.
function getCurrentUserId() {
  // e.g., from session. For demo, hardcode or pass via form.
  return "cmg87rs3w0002vofsnekwzvyg"; // Test user
}

export async function leaveGroup(formData: FormData) {
  const groupId = String(formData.get("groupId") || "");
  const userId  = String(formData.get("userId")  || getCurrentUserId());

  if (!groupId || !userId) throw new Error("Missing groupId or userId");

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

  revalidatePath("/groups");
}