<<<<<<< Updated upstream
// app/(frontend)/(protected)/homepage/page.tsx
import { requireUser } from "@/lib/requireUser";
import prisma from "@/lib/db";
import HomepageClient from "./HomepageClient";
import { sendInWebsiteAlert } from "@/app/(backend)/ScheduleController/sendEmailReminder";
=======
import { requireUser } from "@/lib/requireUser";
import { logout } from "@/app/(backend)/AccountController/logout";
import prisma from "@/lib/db";
import HomepageClient from "./HomepageClient";

async function getProfiles(currentUserId: string) {
  try {
    const profiles = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        eduLevel: true,
        createdAt: true,
        receivedInvites: {
          where: {
            senderId: currentUserId,
          },
          select: {
            id: true,
            groupId: true,
          }
        }
      },
      where: {
        NOT: {
          id: currentUserId
        }
      },
      orderBy: {
        username: 'asc'
      }
    });
    
    return profiles.map(profile => ({
      id: profile.id,
      username: profile.username,
      year: profile.eduLevel ? `Year ${profile.eduLevel}` : 'Not specified',
      gender: 'Not specified',
      hasInvite: profile.receivedInvites.length === 0
    }));
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
}
>>>>>>> Stashed changes

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

//year display
const getYearDisplay = (yearOfStudy: string): string => {
  const yearMap: Record<string, string> = {
    S1: "Sec 1", S2: "Sec 2", S3: "Sec 3", S4: "Sec 4", S5: "Sec 5",
    J1: "JC 1", J2: "JC 2",
    P1: "Poly 1", P2: "Poly 2", P3: "Poly 3",
    U1: "Year 1", U2: "Year 2", U3: "Year 3", U4: "Year 4",
  };
  return yearMap[yearOfStudy] || yearOfStudy;
};

//gender display
const formatGender = (gender: string): string => {
  const genderMap: Record<string, string> = {
    MALE: "Male",
    FEMALE: "Female", 
    OTHER: "Other",
  };
  return genderMap[gender] || gender;
};

//preferred timing display
const formatPreferredTiming = (preferredTiming: string): string => {
  if (!preferredTiming) return "Not specified";
  
  const timings = preferredTiming.split(',').map(timing => {
    const trimmed = timing.trim();
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

  const timingOR =
    timingFilter && timingFilter.length > 0
      ? {
          OR: timingFilter.map((t) => ({
            preferredTiming: { contains: t },
          })),
        }
      : {};

  const rows = await prisma.user.findMany({
    where: {
      NOT: { id: currentUserId },
      eduLevel: currentUser.eduLevel,
      status: 'ACTIVE',
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
  searchParams: Promise<{ timing?: string }>;
}) {
  const user = await requireUser();
<<<<<<< Updated upstream
  
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
=======
  const profiles = await getProfiles(user.id);

  return <HomepageClient user={user} initialProfiles={profiles} />;
>>>>>>> Stashed changes
}