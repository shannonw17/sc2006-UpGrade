// app/(backend)/FilterController/filterGroups.ts
"use server";

import prisma from "@/lib/db";
import {
  type RawFilters,
  type NormalizedFilters,
  normalizeFilters,
  buildWhereCommon,
} from "./filterUtils";

//helper functions to extract form data or object properties
type AnyInput = FormData | Record<string, any>;
function get(of: AnyInput, k: keyof RawFilters | string) {
  return of instanceof FormData ? of.get(k as string)?.toString() : (of as any)[k];
}
function toInt(v: string | undefined, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

//convert form data or object to raw filters
function toRawFilters(input: AnyInput): RawFilters {
  return {
    tab: (get(input, "tab") as any) === "mine" ? "mine" : "all",
    q: (get(input, "q") || "") as string,
    from: (get(input, "from") || "") as string,
    to: (get(input, "to") || "") as string,
    loc: (get(input, "loc") || "") as string,
    open: (get(input, "open") || "") as string, // "1" → openOnly
  };
}

//fetch groups with filters applied
export async function fetchGroupsWithFilters(
  currentUserId: string,
  input: FormData | RawFilters,
  opts?: { userEduLevel?: "SEC" | "JC" | "POLY" | "UNI"; take?: number; skip?: number }
) {
  const raw = input instanceof FormData ? toRawFilters(input) : (input as RawFilters);
  const f: NormalizedFilters = normalizeFilters(raw);
  const whereCommon = buildWhereCommon(f);

  const take = Math.min(opts?.take ?? 1000, 1000);
  const skip = toInt(String(opts?.skip ?? 0));

  const openFilter = (g: any) => (g?._count?.members ?? 0) < g.capacity;

  const baseInclude = {
    _count: { select: { members: true } },
    host: { select: { id: true, username: true, eduLevel: true } },
    members: { where: { userId: currentUserId }, select: { id: true } },
    tags: { select: { id: true, name: true, color: true } },
  } as const;

  //all groups
  const allGroupsRaw = await prisma.group.findMany({
    where: {
      ...whereCommon,
      visibility: true,
      ...(opts?.userEduLevel && { host: { eduLevel: opts.userEduLevel } }),
    },
    include: baseInclude,
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });

  //hosted groups
  const myCreatedGroupsRaw = await prisma.group.findMany({
    where: { ...whereCommon, hostId: currentUserId },
    include: baseInclude,
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });

  //joined groups
  const joinedGroupsRaw = await prisma.group.findMany({
    where: {
      ...whereCommon,
      hostId: { not: currentUserId },
      members: { some: { userId: currentUserId } },
      ...(opts?.userEduLevel && { host: { eduLevel: opts.userEduLevel } }),
    },
    include: baseInclude,
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });

  const joinedSet = new Set<string>();
  for (const g of [...allGroupsRaw, ...myCreatedGroupsRaw, ...joinedGroupsRaw]) {
    if (g.members?.length) joinedSet.add(g.id);
  }

  const allGroups       = f.openOnly ? allGroupsRaw.filter(openFilter)       : allGroupsRaw;
  const myCreatedGroups = f.openOnly ? myCreatedGroupsRaw.filter(openFilter) : myCreatedGroupsRaw;
  const joinedGroups    = f.openOnly ? joinedGroupsRaw.filter(openFilter)    : joinedGroupsRaw;

  const myIds = new Set(myCreatedGroups.map(g => g.id));
  const justJoinedNotCreated = joinedGroups.filter(g => !myIds.has(g.id));

  return {
    allGroups,
    myCreatedGroups,
    joinedGroups: justJoinedNotCreated,
    joinedSet,
  };
}
