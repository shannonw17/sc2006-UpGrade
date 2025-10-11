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

export default async function Home() {
  const user = await requireUser();
  const profiles = await getProfiles(user.id);

  return <HomepageClient user={user} initialProfiles={profiles} />;
}