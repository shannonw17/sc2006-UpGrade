// app/(backend)/FilterController/searchAndFilter.ts
"use server";

import prisma from "@/lib/db";
import { buildWhereCommon, type NormalizedFilters } from "./filterUtils";

export async function fetchGroupsWithFilters(
  currentUserId: string,
  filters: NormalizedFilters,
  userEducationLevel?: string
) {
  const whereCommon = buildWhereCommon(filters);

  let educationLevel = userEducationLevel;
  if (!educationLevel) {
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { eduLevel: true }
    });
    educationLevel = user?.eduLevel;
  }

  const [allGroupsRaw, myMemberships, myCreatedGroupsRaw] = await Promise.all([
    // ALL tab — hide closed
    prisma.group.findMany({
      where: { 
        ...whereCommon, 
        visibility: true,
        isClosed: false,                 // 👈 add this
        ...(educationLevel && {
          host: { eduLevel: educationLevel as any }
        })
      },
      orderBy: { createdAt: "desc" },
      include: { 
        _count: { select: { members: true } },
        host: { select: { username: true, eduLevel: true } },
        tags: true
      },
    }),

    prisma.groupMember.findMany({
      where: { userId: currentUserId },
      select: { groupId: true },
    }),

    // CREATED tab — usually show all your groups (closed or not).
    // If you ALSO want to hide closed here, add isClosed: false below.
    prisma.group.findMany({
      where: { 
        ...whereCommon, 
        hostId: currentUserId,
        // isClosed: false,              // ← uncomment if you want to hide closed in "Created"
      },
      orderBy: { createdAt: "desc" },
      include: { 
        _count: { select: { members: true } },
        host: { select: { username: true, eduLevel: true } },
        tags: true
      },
    }),
  ]);

  const joinedSet = new Set(myMemberships.map(m => m.groupId));

  // JOINED tab — hide closed
  const joinedGroupsRaw = await prisma.group.findMany({
    where: { 
      ...whereCommon, 
      id: { in: Array.from(joinedSet) },
      isClosed: false,                  // 👈 add this
      ...(educationLevel && {
        host: { eduLevel: educationLevel as any }
      })
    },
    orderBy: { createdAt: "desc" },
    include: { 
      _count: { select: { members: true } },
      host: { select: { username: true, eduLevel: true } },
      tags: true
    },
  });

  // keep your openOnly capacity check as-is
  const openFilter = (g: typeof allGroupsRaw[number]) => g._count.members < g.capacity;

  const allGroups        = filters.openOnly ? allGroupsRaw.filter(openFilter)       : allGroupsRaw;
  const myCreatedGroups  = filters.openOnly ? myCreatedGroupsRaw.filter(openFilter) : myCreatedGroupsRaw;
  const joinedGroups     = filters.openOnly ? joinedGroupsRaw.filter(openFilter)    : joinedGroupsRaw;

  const myCreatedIds = new Set(myCreatedGroups.map(g => g.id));
  const justJoinedNotCreated = joinedGroups.filter(g => !myCreatedIds.has(g.id));

  return {
    allGroups,
    myCreatedGroups,
    joinedGroups: justJoinedNotCreated,
    joinedSet,
  };
}
