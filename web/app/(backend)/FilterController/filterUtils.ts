import { Prisma } from "@prisma/client";

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
  const and: Prisma.GroupWhereInput[] = [];

  if (f.q)   and.push({ name: { contains: f.q } });       // SQLite-safe (no mode)
  if (f.loc) and.push({ location: { contains: f.loc } });

  if (f.fromISO) and.push({ start: { gte: f.fromISO } });
  if (f.toISO)   and.push({ end:   { lte: f.toISO } });

  return and.length ? { AND: and } : {};
}
