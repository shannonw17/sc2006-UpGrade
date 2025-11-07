// app/(frontend)/(protected)/homepage/page.tsx
import { requireUser } from "@/lib/requireUser";
import prisma from "@/lib/db";
import HomepageClient from "./HomepageClient";
import { sendInWebsiteAlert } from "@/app/(backend)/ScheduleController/sendEmailReminder";

/* ---------- display helpers (unchanged) ---------- */
type UserCard = {
  id: string;
  email: string;
  username: string;
  gender: string;
  yearOfStudy: string;
  eduLevel: string;
  preferredTiming: string;
  preferredLocations: string;
  currentCourse: string | null;
  relevantSubjects: string | null;
  school: string | null;
  usualStudyPeriod: string | null;
};

const getYearDisplay = (yearOfStudy: string): string => {
  const yearMap: Record<string, string> = {
    S1: "Sec 1", S2: "Sec 2", S3: "Sec 3", S4: "Sec 4", S5: "Sec 5",
    J1: "JC 1", J2: "JC 2",
    P1: "Poly 1", P2: "Poly 2", P3: "Poly 3",
    U1: "Year 1", U2: "Year 2", U3: "Year 3", U4: "Year 4",
  };
  return yearMap[yearOfStudy] || yearOfStudy;
};

const formatGender = (gender: string): string => {
  const genderMap: Record<string, string> = {
    MALE: "Male",
    FEMALE: "Female",
    OTHER: "Other",
  };
  return genderMap[gender] || gender;
};

const formatPreferredTiming = (csv?: string | null): string => {
  if (!csv) return "";
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((t) => {
      const m: Record<string, string> = {
        Morning: "Morning",
        Afternoon: "Afternoon",
        Evening: "Evening",
        Night: "Night",
        Weekdays: "Weekdays",
        Weekends: "Weekends",
      };
      return m[t] || t;
    })
    .join(", ");
};

/* ---------- filters & helpers (mirrors filterProfilesAction) ---------- */
const GenderMap: Record<string, "MALE" | "FEMALE" | "OTHER"> = {
  "m": "MALE", "male": "MALE",
  "f": "FEMALE", "female": "FEMALE",
  "o": "OTHER", "other": "OTHER",
};

const YearMap: Record<string, "S1"|"S2"|"S3"|"S4"|"S5"|"J1"|"J2"|"P1"|"P2"|"P3"|"U1"|"U2"|"U3"|"U4"> = {
  // Sec
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

// CSV “whole-word” matching for preferredTiming (SQLite-safe)
function csvWordOR(field: "preferredTiming", token: string) {
  return {
    OR: [
      { [field]: { equals: token } as any },
      { [field]: { startsWith: token + "," } as any },
      { [field]: { endsWith: "," + token } as any },
      { [field]: { contains: "," + token + "," } as any },
    ],
  };
}

function toArray(csv?: string | null) {
  if (!csv) return [];
  return csv.split(",").map(s => s.trim()).filter(Boolean);
}

/* ---------- data fetch (SSR) ---------- */
async function getProfilesWithFilters(
  currentUserId: string,
  params: {
    q: string;
    year: string;
    gender: string;
    timingCSV: string;
  }
): Promise<{ rows: UserCard[]; total: number }> {
  const me = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { eduLevel: true },
  });
  if (!me) return { rows: [], total: 0 };

  const q = params.q.trim();
  const yearKey = params.year.trim().toLowerCase();
  const genderKey = params.gender.trim().toLowerCase();
  const timingArr = toArray(params.timingCSV);

  const AND: any[] = [
    { id: { not: currentUserId } },             // exclude me
    { eduLevel: me.eduLevel },                   // same edu level
  ];

  if (q) AND.push({ username: { contains: q } });

  if (YearMap[yearKey]) {
    AND.push({ yearOfStudy: YearMap[yearKey] });
  }
  if (GenderMap[genderKey]) {
    AND.push({ gender: GenderMap[genderKey] });
  }
  if (timingArr.length) {
    AND.push({
      OR: timingArr.map((t) => csvWordOR("preferredTiming", t)),
    });
  }

  const where = AND.length ? { AND } : {};

  const [rows, total] = await Promise.all([
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
    }),
    prisma.user.count({ where }),
  ]);

  const mapped = rows.map((u) => ({
    ...u,
    yearOfStudy: getYearDisplay(u.yearOfStudy),
    gender: formatGender(u.gender),
    preferredTiming: formatPreferredTiming(u.preferredTiming),
  })) as UserCard[];

  return { rows: mapped, total };
}

/* ---------- page ---------- */
export const runtime = "nodejs";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();

  // notifications
  const raw = await sendInWebsiteAlert();

  const msg: string[] = Array.isArray(raw)
    ? raw
        .map((n: any) => n?.message ?? n?.content ?? n?.text ?? "")
        .filter((s: any) => typeof s === "string" && s.length > 0)
        .map(String)
    : [];

  const sp = (await searchParams) ?? {};
  
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] ?? "" : v ?? "";
 
  const query  = first(sp.query).trim();
  const year   = first(sp.year).trim();
  const gender = first(sp.gender).trim();
  const timing = first(sp.timing).trim();

  const { rows: profiles, total } = await getProfilesWithFilters(user.id, {
    q: query,
    year,
    gender,
    timingCSV: timing,
  });

  return (
    <HomepageClient
      user={user}
      initialProfiles={profiles}
      messages={msg}
      initialTotal={total}
      initialFilters={{
        searchQuery: query,
        yearFilter: year,
        genderFilter: gender,
        timingFilter: timing,
      }}
    />
  );
}
