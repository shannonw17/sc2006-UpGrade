// app/(backend)/ConflictController/checkGroupStatus.ts
"use server";

import prisma from "@/lib/db";

/**
 * Returns true iff the group:
 *  - exists
 *  - is NOT closed
 *  - is NOT full (currentSize < capacity)
 *  - has NOT expired (start > now)
 */
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

/* Optional: a detailed variant for debugging/logging
export type GroupStatusReason = "ok" | "not-found" | "closed" | "full" | "expired";

export async function checkGroupStatusDetailed(
  groupId: string,
  now: Date = new Date()
): Promise<{ ok: boolean; reason: GroupStatusReason }> {
  if (!groupId) return { ok: false, reason: "not-found" };

  const g = await prisma.group.findUnique({
    where: { id: groupId },
    select: { isClosed: true, currentSize: true, capacity: true, start: true },
  });

  if (!g) return { ok: false, reason: "not-found" };
  if (g.isClosed) return { ok: false, reason: "closed" };
  if (g.currentSize >= g.capacity) return { ok: false, reason: "full" };
  if (!g.start || g.start <= now) return { ok: false, reason: "expired" };

  return { ok: true, reason: "ok" };
}
*/
