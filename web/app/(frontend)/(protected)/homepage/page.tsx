// app/homepage/page.tsx
import { requireUser } from "@/lib/requireUser";
import prisma from "@/lib/db";
import HomepageClient from "./HomepageClient";
import { sendInWebsiteAlert } from "@/app/(backend)/ScheduleController/sendEmailReminder";

// Shape matching HomepageClient's UserCard (no need to export)
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

// Helper function to get year display text
const getYearDisplay = (yearOfStudy: string): string => {
  const yearMap: Record<string, string> = {
    S1: "Sec 1", S2: "Sec 2", S3: "Sec 3", S4: "Sec 4", S5: "Sec 5",
    J1: "JC 1", J2: "JC 2",
    P1: "Poly 1", P2: "Poly 2", P3: "Poly 3",
    U1: "Year 1", U2: "Year 2", U3: "Year 3", U4: "Year 4",
  };
  return yearMap[yearOfStudy] || yearOfStudy;
};

// Helper function to get year color class
const getYearColor = (yearOfStudy: string): string => {
  const yearDisplay = getYearDisplay(yearOfStudy);
  const colorMap: Record<string, string> = {
    'Sec 1': 'bg-red-100 text-red-800',
    'Sec 2': 'bg-orange-100 text-orange-800',
    'Sec 3': 'bg-amber-100 text-amber-800',
    'Sec 4': 'bg-yellow-100 text-yellow-800',
    'Sec 5': 'bg-lime-100 text-lime-800',
    'JC 1': 'bg-green-100 text-green-800',
    'JC 2': 'bg-emerald-100 text-emerald-800',
    'Poly 1': 'bg-cyan-100 text-cyan-800',
    'Poly 2': 'bg-blue-100 text-blue-800',
    'Poly 3': 'bg-indigo-100 text-indigo-800',
    'Year 1': 'bg-red-100 text-red-800',
    'Year 2': 'bg-yellow-100 text-yellow-800',
    'Year 3': 'bg-blue-100 text-blue-800',
    'Year 4': 'bg-green-100 text-green-800',
  };
  return colorMap[yearDisplay] || 'bg-gray-100 text-gray-800';
};

// Helper function to format gender for display
const formatGender = (gender: string): string => {
  const genderMap: Record<string, string> = {
    MALE: "Male",
    FEMALE: "Female", 
    OTHER: "Other",
  };
  return genderMap[gender] || gender;
};

// Helper function to format preferred timing for display
const formatPreferredTiming = (preferredTiming: string): string => {
  if (!preferredTiming) return "Not specified";
  
  // Split by comma and format each timing
  const timings = preferredTiming.split(',').map(timing => {
    const trimmed = timing.trim();
    // Capitalize first letter of each timing
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  });
  
  return timings.join(', ');
};

async function getProfiles(currentUserId: string, timingFilter?: string[]): Promise<UserCard[]> {
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { eduLevel: true },
  });
  if (!currentUser) return [];

  // Build CSV "whole token" matching for SQLite String column
  // (simple contains is ok if you control the tokens: Morning/Afternoon/Evening/Night)
  const timingOR =
    timingFilter && timingFilter.length > 0
      ? {
          OR: timingFilter.map((t) => ({
            preferredTiming: { contains: t }, // no mode: "insensitive" on SQLite
          })),
        }
      : {};

  const rows = await prisma.user.findMany({
    where: {
      NOT: { id: currentUserId },
      eduLevel: currentUser.eduLevel,
      ...timingOR,
    },
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
  });

  // Transform the data to include formatted year, gender, and preferred timing
  return rows.map(user => ({
    ...user,
    yearOfStudy: getYearDisplay(user.yearOfStudy),
    gender: formatGender(user.gender),
    preferredTiming: formatPreferredTiming(user.preferredTiming),
  })) as UserCard[];
}

export default async function Home({
  searchParams,
}: {
  // In Next.js 15 App Router, searchParams is now a Promise that needs to be awaited
  searchParams: Promise<{ timing?: string }>;
}) {
  const user = await requireUser();
  
  // ✅ AWAIT the searchParams promise first
  const resolvedSearchParams = await searchParams;

  const timingFilter = resolvedSearchParams?.timing
    ? resolvedSearchParams.timing.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const profiles = await getProfiles(user.id, timingFilter);

  const messages = await sendInWebsiteAlert();
  const msg: string[] = [];
  for (const n of messages) {
    if ((n as any).User === user.id) msg.push((n as any).message);
  }

  return (
    <HomepageClient
      user={user}
      initialProfiles={profiles}
      messages={msg}
      initialTotal={profiles.length}
      initialFilters={{
        searchQuery: "",
        yearFilter: "",
        genderFilter: "",
        timingFilter: timingFilter.join(","),
      }}
    />
  );
}