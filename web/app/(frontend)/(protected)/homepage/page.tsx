import { requireUser } from "@/lib/requireUser";
import prisma from "@/lib/db";
import HomepageClient from "./HomepageClient";
import { sendInWebsiteAlert } from "@/app/(backend)/ScheduleController/sendEmailReminder";


async function getProfiles(currentUserId: string, timingFilter?: string[]) {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { eduLevel: true, preferredTiming: true }
    });

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    const profiles = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        yearOfStudy: true,
        gender: true,
        email: true,
        eduLevel: true,
        preferredTiming: true,
        status: true,
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
        },
        eduLevel: currentUser.eduLevel,
        // Fix: Remove 'mode' property for SQLite compatibility
        ...(timingFilter && timingFilter.length > 0 && {
          OR: timingFilter.map(timing => ({
            preferredTiming: {
              contains: timing
            }
          }))
        })
      },
      orderBy: {
        username: 'asc'
      }
    });

    const yearMap: Record<string, string> = {
      S1: "Sec 1", S2: "Sec 2", S3: "Sec 3", S4: "Sec 4", S5: "Sec 5",
      J1: "JC 1", J2: "JC 2",
      P1: "Poly 1", P2: "Poly 2", P3: "Poly 3",
      U1: "Year 1", U2: "Year 2", U3: "Year 3", U4: "Year 4",
    };
    
    const getYearColor = (year: string): string => {
      const colorMap: Record<string, string> = {
        'Sec 1': 'text-red-600',
        'Sec 2': 'text-orange-600',
        'Sec 3': 'text-amber-600',
        'Sec 4': 'text-yellow-600',
        'Sec 5': 'text-lime-600',
        'JC 1': 'text-green-600',
        'JC 2': 'text-emerald-600',
        'Poly 1': 'text-cyan-600',
        'Poly 2': 'text-blue-600',
        'Poly 3': 'text-indigo-700',
        'Year 1': 'text-red-600',
        'Year 2': 'text-yellow-700',
        'Year 3': 'text-blue-600',
        'Year 4': 'text-green-600',
      };
      return colorMap[year];
    };

    const genderMap: Record<string, string> = {
      MALE: "Male",
      FEMALE: "Female", 
      OTHER: "Other",
    };

    return profiles.map(profile => {
      const yearDisplay = yearMap[profile.yearOfStudy];
      return {
        id: profile.id,
        username: profile.username,
        year: yearDisplay,
        yearColor: getYearColor(yearDisplay),
        gender: genderMap[profile.gender],
        preferredTiming: profile.preferredTiming,
        hasInvite: profile.receivedInvites.length === 0
      };
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
}

export default async function Home({
  searchParams
}: {
  searchParams?: Promise<{ timing?: string }>
}) {
  const user = await requireUser();
  const sp = await searchParams;
  
  // Parse timing filter from URL params
  const timingFilter = sp?.timing ? sp.timing.split(',') : [];
  
  const profiles = await getProfiles(user.id, timingFilter);
  const messages = await sendInWebsiteAlert();

  return (
    <HomepageClient
      user={user}
      initialProfiles={profiles}
      messages={messages}
    />
  );
}