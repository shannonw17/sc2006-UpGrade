// app/(backend)/FilterController/filterUtils.ts
import type { Prisma } from "@prisma/client";

export type RawFilters = {
  tab?: "all" | "mine" | "joined";
  q?: string;
  from?: string; // "YYYY-MM-DD"
  to?: string;   // "YYYY-MM-DD"
  loc?: string;
  open?: string; 
};

export type NormalizedFilters = {
  tab: "all" | "mine" | "joined";
  q: string;
  loc: string;
  fromISO?: Date; 
  toISO?: Date;   
  openOnly: boolean;
};

//build a Date for local start-of-day (inclusive)
function startOfDayLocal(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const d = new Date(`${dateStr}T00:00:00`);
  return isNaN(+d) ? undefined : d;
}

//build a Date for local start-of-next-day (exclusive)
function nextDayStartLocal(dateStr: string): Date | undefined {
  const d = startOfDayLocal(dateStr);
  if (!d) return undefined;
  d.setDate(d.getDate() + 1);
  return d;
}

export function normalizeFilters(sp?: RawFilters): NormalizedFilters {
  const allowed = new Set<NormalizedFilters["tab"]>(["all", "mine", "joined"]);
  const tab = allowed.has(sp?.tab as any) ? (sp!.tab as any) : "all";

  const q = (sp?.q ?? "").trim();
  const loc = (sp?.loc ?? "").trim();

  const fromISO = sp?.from ? startOfDayLocal(sp.from) : undefined;
  const toISO   = sp?.to   ? nextDayStartLocal(sp.to) : undefined;

  return {
    tab,
    q,
    loc,
    fromISO,
    toISO,
    openOnly: sp?.open === "1",
  };
}

export function buildWhereCommon(f: NormalizedFilters): Prisma.GroupWhereInput {
  const AND: Prisma.GroupWhereInput[] = [];

  if (f.q) {
    AND.push({
      OR: [
        { name:     { contains: f.q } },
        { location: { contains: f.q } },
        { host:     { username: { contains: f.q } } },
        { tags:     { some: { name: { contains: f.q } } } },
      ],
    });
  }

  //location filter (case-insensitive)
  if (f.loc) {
    AND.push({ location: { contains: f.loc } });
  }

  //fromISO: start >= fromISO  (inclusive)
  //toISO:   start <  toISO    (exclusive of next day)
  if (f.fromISO && f.toISO) {
    AND.push({ start: { gte: f.fromISO, lt: f.toISO } });
  } else if (f.fromISO) {
    AND.push({ start: { gte: f.fromISO } });
  } else if (f.toISO) {
    AND.push({ start: { lt: f.toISO } });
  }

  return AND.length ? { AND } : {};
}