import prisma from "@/lib/db";

/**
 * Close groups when:
 *  - start <= now (time-expired), OR
 *  - currentSize >= capacity (full), OR
 *  - isClosed === true (host closed; we still cleanup pending invites)
 *
 * Then delete pending invitations and their linked notifications.
 * Idempotent: safe to re-run.
 */
export async function runExpireGroupsJob() {
  const now = new Date();

  // Fetch candidates (we'll do currentSize >= capacity in JS)
  const candidates = await prisma.group.findMany({
    select: { id: true, isClosed: true, start: true, capacity: true, currentSize: true },
  });

  const affected = candidates.filter(
    (g) => g.isClosed === true || g.start <= now || g.currentSize >= g.capacity
  );
  if (affected.length === 0) return { closedGroups: 0, deletedInvites: 0 };

  const groupIds = affected.map((g) => g.id);
  const toCloseIds = affected.filter((g) => !g.isClosed).map((g) => g.id);

  const pendingInvites = await prisma.invitation.findMany({
    where: { groupId: { in: groupIds } },
    select: { id: true },
  });
  const inviteIds = pendingInvites.map((i) => i.id);

  const tx = await prisma.$transaction([
    ...(toCloseIds.length
      ? [
          prisma.group.updateMany({
            where: { id: { in: toCloseIds }, isClosed: false },
            data: { isClosed: true },
          }),
        ]
      : []),
    prisma.notification.deleteMany({
      where: inviteIds.length ? { invitationId: { in: inviteIds } } : { id: "" },
    }),
    prisma.invitation.deleteMany({
      where: inviteIds.length ? { id: { in: inviteIds } } : { id: "" },
    }),
  ]);

  const closedGroups = toCloseIds.length ? (tx[0] as any)?.count ?? 0 : 0;
  const deletedInvites = inviteIds.length ? (tx.at(-1) as any)?.count ?? 0 : 0;

  return { closedGroups, deletedInvites };
}
