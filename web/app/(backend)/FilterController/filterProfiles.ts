// app/(backend)/FilterController/filterProfiles.ts

"use server";

import prisma from "@/lib/db";

// ---------- helpers ----------
function toArray(csv?: string | null) {
  if (!csv) return [];
  return csv.split(",").map(s => s.trim()).filter(Boolean);
}

function toInt(value: string | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

const GenderMap: Record<string, "MALE" | "FEMALE" | "OTHER"> = {
  male: "MALE",
  female: "FEMALE",
  other: "OTHER",
};

const YearMap: Record<string, 
  | "S1"|"S2"|"S3"|"S4"|"S5"
  | "J1"|"J2"
  | "P1"|"P2"|"P3"
  | "U1"|"U2"|"U3"|"U4"
> = {
  // Secondary
  "s1": "S1", "sec1": "S1", "secondary 1": "S1", "year 1 (sec)": "S1",
  "s2": "S2", "sec2": "S2", "secondary 2": "S2",
  "s3": "S3", "sec3": "S3", "secondary 3": "S3",
  "s4": "S4", "sec4": "S4", "secondary 4": "S4",
  "s5": "S5", "sec5": "S5", "secondary 5": "S5",
  // JC
  "j1": "J1", "year 1 (jc)": "J1",
  "j2": "J2", "year 2 (jc)": "J2",
  // Poly
  "p1": "P1", "year 1 (poly)": "P1",
  "p2": "P2", "year 2 (poly)": "P2",
  "p3": "P3", "year 3 (poly)": "P3",
  // Uni
  "u1": "U1", "year 1": "U1", "year 1 (uni)": "U1",
  "u2": "U2", "year 2": "U2", "year 2 (uni)": "U2",
  "u3": "U3", "year 3": "U3", "year 3 (uni)": "U3",
  "u4": "U4", "year 4": "U4", "year 4 (uni)": "U4",
};

// “Whole word” CSV matching for SQLite (String column):
// We emulate array overlap by OR-ing these patterns:
//   equals "Morning"
//   startsWith "Morning,"
//   endsWith ",Morning"
//   contains ",Morning,"
function csvWordOR(field: "preferredTiming", token: string) {
  return {
    OR: [
      { [field]: { equals: token } },
      { [field]: { startsWith: token + "," } },
      { [field]: { endsWith: "," + token } },
      { [field]: { contains: "," + token + "," } },
    ],
  };
}

// --------- types ----------
type FilterInput = {
  searchQuery?: string;
  yearFilter?: string;
  genderFilter?: string;
  timingFilter?: string; // "Morning,Evening"
  take?: number | string;
  skip?: number | string;
  // Optional: constrain results to same edu level as current user (SEC|JC|POLY|UNI)
  eduLevel?: "SEC" | "JC" | "POLY" | "UNI";
  excludeUserId?: string;
};

// Accept FormData or POJO
function getter(formDataOrObj: FormData | FilterInput) {
  return (k: string) =>
    formDataOrObj instanceof FormData
      ? formDataOrObj.get(k)?.toString()
      : ((formDataOrObj as any)[k] as string | undefined);
}

// ---------- action ----------
export async function filterProfilesAction(formDataOrObj: FormData | FilterInput) {
  try {
    const get = getter(formDataOrObj);

    const rawSearch = (get("searchQuery") || "").trim();
    const rawYear   = (get("yearFilter")  || "").trim();
    const rawGender = (get("genderFilter")|| "").trim();
    const rawTiming =  get("timingFilter") || "";
    const rawEdu    = (get("eduLevel")    || "").trim();
    const excludeId = (get("excludeUserId") || "").trim();

    const timingArr = toArray(rawTiming);
    const take = Math.min(toInt(get("take") as any, 24), 100);
    const skip = toInt(get("skip") as any, 0);

    const yearKey = rawYear.toLowerCase();
    const genderKey = rawGender.toLowerCase();
    const eduKey = rawEdu.toUpperCase() as any;

    const yearOfStudy = YearMap[yearKey] ?? undefined;
    const gender = GenderMap[genderKey] ?? undefined;
    const eduLevel =
      eduKey === "SEC" || eduKey === "JC" || eduKey === "POLY" || eduKey === "UNI"
        ? eduKey
        : undefined;

    // Build WHERE
    const andConditions: any[] = [];
    andConditions.push({ status: "ACTIVE" });

    // Constrain to same eduLevel
    if (eduLevel) andConditions.push({ eduLevel });

    const notClause = excludeId ? { NOT: { id: excludeId } } : undefined; 

    if (rawSearch) {
      andConditions.push({
        OR: [
          { username: { contains: rawSearch } },
        ],
      });
    }

    if (yearOfStudy) andConditions.push({ yearOfStudy });
    if (gender) andConditions.push({ gender });

    if (timingArr.length) {
      andConditions.push({
        OR: timingArr.map(t => csvWordOR("preferredTiming", t)),
      });
    }

    const where =
      andConditions.length || notClause
        ? { AND: andConditions, ...(notClause || {}) }
        : {};

    const [profiles, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          gender: true,
          yearOfStudy: true,
          eduLevel: true,
          preferredTiming: true,
          preferredLocations: true,
          currentCourse: true,
          relevantSubjects: true,
          school: true,
          usualStudyPeriod: true,
        },
        orderBy: { username: "asc" },
        take,
        skip,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      profiles,
      total,
      page: { take, skip, count: profiles.length },
    };
  } catch (e) {
    console.error("[filterProfilesAction] error:", e);
    return { success: false, error: "Database error while filtering profiles" };
  }
}
