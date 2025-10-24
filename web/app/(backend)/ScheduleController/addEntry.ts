// app/(backend)/ScheduleController/addEntry.ts
"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function addEntry() {
  try {
    const user = await requireUser();
    
    // Fetch groups where the user is a member OR host
    const studyGroups = await prisma.group.findMany({
      where: {
        OR: [
          { hostId: user.id }, // User is host
          { 
            members: {
              some: {
                userId: user.id
              }
            }
          } // User is member
        ]
      },
      include: {
        host: {
          select: {
            username: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                username: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        start: 'asc'
      }
    });

    console.log(`Fetched ${studyGroups.length} study groups for user ${user.username}`);
    
    // Filter out expired groups (end time + 72 hours)
    const now = Date.now();
    const validStudyGroups = studyGroups.filter(group => {
      if (!group.end) return false;
      
      const endTime = new Date(group.end).getTime();
      const expiryTime = endTime + 72 * 60 * 60 * 1000; // +72 hours

      return now <= expiryTime;
    });

    console.log(`After filtering: ${validStudyGroups.length} valid study groups`);
    
    return validStudyGroups;
  } catch (error) {
    console.error("Error in addEntry:", error);
    return [];
  }
}