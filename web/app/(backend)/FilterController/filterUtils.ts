// app/(backend)/FilterController/filterUtils.ts
import type { Prisma } from "@prisma/client";

export type RawFilters = {
  tab?: "all" | "mine" | "joined";
  q?: string;
  from?: string;
  to?: string;
  loc?: string;
  open?: string; // "1"
};

export type NormalizedFilters = {
  tab: "all" | "mine" | "joined";
  q: string;
  loc: string;
  fromISO?: Date;
  toISO?: Date;
  openOnly: boolean;
};

export function normalizeFilters(sp?: RawFilters): NormalizedFilters {
  const allowed = new Set<NormalizedFilters["tab"]>(["all", "mine", "joined"]);
  const tab = allowed.has(sp?.tab as any) ? (sp!.tab as any) : "all";
  const q = (sp?.q ?? "").trim();
  const loc = (sp?.loc ?? "").trim();
  const fromISO = sp?.from ? new Date(sp.from) : undefined;
  const toISO   = sp?.to   ? new Date(sp.to)   : undefined;

  return {
    tab,
    q,
    loc,
    fromISO: fromISO && !isNaN(+fromISO) ? fromISO : undefined,
    toISO:   toISO   && !isNaN(+toISO)   ? toISO   : undefined,
    openOnly: sp?.open === "1",
  };
}

export function buildWhereCommon(f: NormalizedFilters): Prisma.GroupWhereInput {
  const AND: Prisma.GroupWhereInput[] = [];

  // 🔎 Keyword search across name, location, host.username, and TAG NAMES
  if (f.q) {
    AND.push({
      OR: [
        { name: { contains: f.q } },                   // group name
        { location: { contains: f.q } },               // location text
        { host: { username: { contains: f.q } } },     // host username (if relation exists)
        { tags: { some: { name: { contains: f.q } } } } // ✅ tag names
      ],
    });
  }

  // Location filter (kept separate so "loc" UI filter still works)
  if (f.loc) {
    AND.push({ location: { contains: f.loc } });
  }

  // Date range
  if (f.fromISO) AND.push({ start: { gte: f.fromISO } });
  if (f.toISO)   AND.push({ end:   { lte: f.toISO } });

  return AND.length ? { AND } : {};
}
