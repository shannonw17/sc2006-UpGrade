// app/(backend)/FilterController/filterUtils.ts
import type { Prisma } from "@prisma/client";

export type RawFilters = {
  tab?: "all" | "mine" | "joined";
  q?: string;
  from?: string; // "YYYY-MM-DD"
  to?: string;   // "YYYY-MM-DD"
  loc?: string;
  open?: string; // "1"
};

export type NormalizedFilters = {
  tab: "all" | "mine" | "joined";
  q: string;
  loc: string;
  fromISO?: Date; // inclusive lower bound (00:00 local)
  toISO?: Date;   // exclusive upper bound (next day 00:00 local)
  openOnly: boolean;
};

/** Build a Date at local 00:00 for the given yyyy-mm-dd (avoids TZ surprises) */
function startOfDayLocal(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const d = new Date(`${dateStr}T00:00:00`);
  return isNaN(+d) ? undefined : d;
}

/** Build a Date for next day local 00:00 (exclusive upper bound) */
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

  // IMPORTANT:
  // fromISO  = start-of-day inclusive
  // toISO    = start-of-next-day exclusive
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

  // 🔎 Keyword search across name, location, host.username, and TAG NAMES (case-insensitive)
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

  // Location filter (case-insensitive)
  if (f.loc) {
    AND.push({ location: { contains: f.loc } });
  }

  // 📅 Date window on group.start:
  // fromISO: start >= fromISO  (inclusive)
  // toISO:   start <  toISO    (exclusive of next day)
  if (f.fromISO && f.toISO) {
    AND.push({ start: { gte: f.fromISO, lt: f.toISO } });
  } else if (f.fromISO) {
    AND.push({ start: { gte: f.fromISO } });
  } else if (f.toISO) {
    AND.push({ start: { lt: f.toISO } });
  }

  return AND.length ? { AND } : {};
}
