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
    // For "all" tab: only show groups from hosts with same education level
    prisma.group.findMany({
      where: { 
        ...whereCommon, 
        visibility: true,
        // Add education level filter for "all" tab
        ...(educationLevel && {
          host: {
            eduLevel: educationLevel as any // Fix: Cast to any to bypass strict type checking
          }
        })
      },
      orderBy: { createdAt: "desc" },
      include: { 
        _count: { select: { members: true } },
        host: {
          select: {
            username: true,
            eduLevel: true
          }
        },
        tags: true
      },
    }),
    prisma.groupMember.findMany({
      where: { userId: currentUserId },
      select: { groupId: true },
    }),
    // For "mine" tab: show all groups created by user (no education level filter)
    prisma.group.findMany({
      where: { ...whereCommon, hostId: currentUserId },
      orderBy: { createdAt: "desc" },
      include: { 
        _count: { select: { members: true } },
        host: {
          select: {
            username: true,
            eduLevel: true
          }
        },
        tags: true
      },
    }),
  ]);

  const joinedSet = new Set(myMemberships.map(m => m.groupId));

  // For "joined" tab: only show joined groups from hosts with same education level
  const joinedGroupsRaw = await prisma.group.findMany({
    where: { 
      ...whereCommon, 
      id: { in: Array.from(joinedSet) },
      // Add education level filter for "joined" tab
      ...(educationLevel && {
        host: {
          eduLevel: educationLevel as any // Fix: Cast to any to bypass strict type checking
        }
      })
    },
    orderBy: { createdAt: "desc" },
    include: { 
      _count: { select: { members: true } },
      host: {
        select: {
          username: true,
          eduLevel: true
        }
      },
      tags: true
    },
  });

  // Fix: Properly type the groups and fix the openFilter function
  const openFilter = (g: typeof allGroupsRaw[number]) => g._count.members < g.capacity;

  const allGroups = filters.openOnly ? allGroupsRaw.filter(openFilter) : allGroupsRaw;
  const myCreatedGroups = filters.openOnly ? myCreatedGroupsRaw.filter(openFilter) : myCreatedGroupsRaw;
  const joinedGroups = filters.openOnly ? joinedGroupsRaw.filter(openFilter) : joinedGroupsRaw;

  const myCreatedIds = new Set(myCreatedGroups.map(g => g.id));
  const justJoinedNotCreated = joinedGroups.filter(g => !myCreatedIds.has(g.id));

  return {
    allGroups,
    myCreatedGroups,
    joinedGroups: justJoinedNotCreated,
    joinedSet,
  };
}