// app/(backend)/GroupController/expireGroup.ts
"use server";

import prisma from "@/lib/db";

/**
 * Close groups whose start <= now, then hard-delete groups already-closed
 * whose start <= cutoff (grace window).
 */
export async function expireGroupsNow(now = new Date()): Promise<{
  closedCount: number;
  deletedCount: number;
  invitationsDeleted: number;
  deletedIds: string[];
  debug?: { cutoffISO: string; candidateIds: string[]; candidateStarts: string[] };
}> {
  let closedCount = 0;
  let invitationsDeleted = 0;
  let deletedCount = 0;
  const deletedIds: string[] = [];

  // 1) Close newly expired groups
  const toExpire = await prisma.group.findMany({
    where: { isClosed: false, start: { lte: now } },
    select: { id: true },
  });

  if (toExpire.length > 0) {
    const ids = toExpire.map(g => g.id);
    const [upd, delInv] = await prisma.$transaction([
      prisma.group.updateMany({
        where: { id: { in: ids } },
        data: { isClosed: true },
      }),
      prisma.invitation.deleteMany({
        where: { groupId: { in: ids } },
      }),
    ]);
    closedCount = upd.count;
    invitationsDeleted = delInv.count;
  }

  // 2) Hard-delete closed groups older than the grace window
  //    (Prisma schema has onDelete: Cascade for children, so one deleteMany is sufficient.)
  const cutoff = new Date(now.getTime() - 1 * 60 * 1000); // 1 minute grace
  const oldClosed = await prisma.group.findMany({
    where: { isClosed: true, start: { lte: cutoff } },
    select: { id: true, start: true },
  });

  if (oldClosed.length > 0) {
    const idsToDelete = oldClosed.map(g => g.id);

    // Optional: if you prefer a transaction, wrap in $transaction([]).
    const delRes = await prisma.group.deleteMany({
      where: { id: { in: idsToDelete } },
    });

    deletedCount = delRes.count;
    deletedIds.push(...idsToDelete);
  }

  return {
    closedCount,
    deletedCount,
    invitationsDeleted,
    deletedIds,
    // Debug info you can log in cron to verify the time filter is matching what you expect.
    debug: {
      cutoffISO: cutoff.toISOString(),
      candidateIds: oldClosed.map(g => g.id),
      candidateStarts: oldClosed.map(g => g.start.toISOString()),
    },
  };
}
