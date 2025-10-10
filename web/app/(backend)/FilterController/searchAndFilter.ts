"use server";

import prisma from "@/lib/db";
import { buildWhereCommon, type NormalizedFilters } from "./filterUtils";

// Can use this to build user profile filtering too
// (e.g. in a "find members" page)

export async function fetchGroupsWithFilters(
  currentUserId: string,
  filters: NormalizedFilters
) {
  const whereCommon = buildWhereCommon(filters);

  const [allGroupsRaw, myMemberships, myCreatedGroupsRaw] = await Promise.all([
    prisma.group.findMany({
      where: { ...whereCommon, visibility: true },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true } } },
    }),
    prisma.groupMember.findMany({
      where: { userId: currentUserId },
      select: { groupId: true },
    }),
    prisma.group.findMany({
      where: { ...whereCommon, hostId: currentUserId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true } } },
    }),
  ]);

  const joinedSet = new Set(myMemberships.map(m => m.groupId));

  const joinedGroupsRaw = await prisma.group.findMany({
    where: { ...whereCommon, id: { in: Array.from(joinedSet) } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true } } },
  });

  const openFilter = (g: typeof allGroupsRaw[number]) => g._count.members < g.capacity;

  const allGroups       = filters.openOnly ? allGroupsRaw.filter(openFilter)       : allGroupsRaw;
  const myCreatedGroups = filters.openOnly ? myCreatedGroupsRaw.filter(openFilter) : myCreatedGroupsRaw;
  const joinedGroups    = filters.openOnly ? joinedGroupsRaw.filter(openFilter)    : joinedGroupsRaw;

  const myCreatedIds = new Set(myCreatedGroups.map(g => g.id));
  const justJoinedNotCreated = joinedGroups.filter(g => !myCreatedIds.has(g.id));

  return {
    allGroups,
    myCreatedGroups,
    joinedGroups: justJoinedNotCreated,
    joinedSet,
  };
}
