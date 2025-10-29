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

  // No mapping needed—already matches UserCard
  return rows as UserCard[];
}

export default async function Home({
  searchParams,
}: {
  // In App Router, searchParams is a plain object
  searchParams?: { timing?: string };
}) {
  const user = await requireUser();

  const timingFilter = searchParams?.timing
    ? searchParams.timing.split(",").map((s) => s.trim()).filter(Boolean)
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
