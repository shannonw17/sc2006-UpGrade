// app/(backend)/ConflictController/checkGroupStatus.ts
"use server";

import prisma from "@/lib/db";

export async function checkGroupStatus(groupId: string, now: Date = new Date()): Promise<boolean> {
  if (!groupId) return false;

  const g = await prisma.group.findUnique({
    where: { id: groupId },
    select: { isClosed: true, currentSize: true, capacity: true, start: true },
  });

  if (!g) return false;
  if (g.isClosed) return false;
  if (g.currentSize >= g.capacity) return false;
  if (!g.start || g.start <= now) return false;

  return true;
}