// app/(backend)/FilterController/filterGroups.ts
"use server";

import prisma from "@/lib/db";
import {
  type RawFilters,
  type NormalizedFilters,
  normalizeFilters,
  buildWhereCommon,
} from "./filterUtils";

// ---------- helpers ----------
type AnyInput = FormData | Record<string, any>;
function get(of: AnyInput, k: keyof RawFilters | string) {
  return of instanceof FormData ? of.get(k as string)?.toString() : (of as any)[k];
}
function toInt(v: string | undefined, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

// Optional: accept either FormData or POJO of RawFilters.
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

// ---------- main ----------
/**
 * Fetch groups using the same filter model as your FilterUtils:
 * - Accepts FormData or plain object with RawFilters keys
 * - Normalizes to NormalizedFilters
 * - Builds Prisma where via buildWhereCommon(f)
 * - Enforces public + same eduLevel for "all" (if provided)
 * - Post-filters openOnly (members < capacity)
 * - ✨ Includes `tags` for the cards
 */
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

  // Helper: members count < capacity
  const openFilter = (g: any) => (g?._count?.members ?? 0) < g.capacity;

  // Common include for all queries — now includes tags 👇
  const baseInclude = {
    _count: { select: { members: true } },
    host: { select: { id: true, username: true, eduLevel: true } },
    members: { where: { userId: currentUserId }, select: { id: true } },
    tags: { select: { id: true, name: true, color: true } }, // <- needed for UI chips
  } as const;

  // --- ALL (public + optional same edu level as current user) ---
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

  // --- MINE (hosted by me) ---
  const myCreatedGroupsRaw = await prisma.group.findMany({
    where: { ...whereCommon, hostId: currentUserId },
    include: baseInclude,
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });

  // --- JOINED (not hosted by me) ---
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

  // Build joined set for quick UI checks
  const joinedSet = new Set<string>();
  for (const g of [...allGroupsRaw, ...myCreatedGroupsRaw, ...joinedGroupsRaw]) {
    if (g.members?.length) joinedSet.add(g.id);
  }

  // Apply openOnly post-query to lists that have _count
  const allGroups       = f.openOnly ? allGroupsRaw.filter(openFilter)       : allGroupsRaw;
  const myCreatedGroups = f.openOnly ? myCreatedGroupsRaw.filter(openFilter) : myCreatedGroupsRaw;
  const joinedGroups    = f.openOnly ? joinedGroupsRaw.filter(openFilter)    : joinedGroupsRaw;

  // Avoid duplicates between "mine" and "joined"
  const myIds = new Set(myCreatedGroups.map(g => g.id));
  const justJoinedNotCreated = joinedGroups.filter(g => !myIds.has(g.id));

  return {
    allGroups,
    myCreatedGroups,
    joinedGroups: justJoinedNotCreated,
    joinedSet,
  };
}
