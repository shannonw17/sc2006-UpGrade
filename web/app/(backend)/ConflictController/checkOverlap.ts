// to add in acceptInvite.ts and joinGroup.ts

// check if time range of grp abt to be joined conflicts with any grps user is currently a member of

// app/(backend)/ConflictController/checkOverlap.ts
// app/(backend)/ConflictController/checkOverlap.ts
"use server";

import prisma from "@/lib/db";

export async function checkOverlap(userId: string, newGroupId: string) {
  try {
    // Get the new group details
    const newGroup = await prisma.group.findUnique({
      where: { id: newGroupId },
      select: {
        id: true,
        name: true,
        start: true,
        end: true
      }
    });

    if (!newGroup) {
      return { conflict: false };
    }

    // Get all groups the user is currently in (as host or member)
    const userGroups = await prisma.group.findMany({
      where: {
        OR: [
          { hostId: userId },
          { 
            members: {
              some: {
                userId: userId
              }
            }
          }
        ]
      },
      include: {
        host: {
          select: {
            username: true
          }
        },
        members: {
          select: {
            userId: true
          }
        }
      }
    });

    // Check for overlaps with each existing group
    for (const existingGroup of userGroups) {
      // Skip the same group (in case user is re-joining)
      if (existingGroup.id === newGroupId) {
        continue;
      }

      // Check if time periods overlap
      const newStart = new Date(newGroup.start);
      const newEnd = new Date(newGroup.end);
      const existingStart = new Date(existingGroup.start);
      const existingEnd = new Date(existingGroup.end);

      // Check for overlap: if one group starts before the other ends and ends after the other starts
      const hasOverlap = newStart < existingEnd && newEnd > existingStart;

      if (hasOverlap) {
        return {
          conflict: true,
          conflictingGroup: {
            id: existingGroup.id,
            name: existingGroup.name,
            start: existingGroup.start,
            end: existingGroup.end,
            location: existingGroup.location
          },
          newGroup: {
            id: newGroup.id,
            name: newGroup.name,
            start: newGroup.start,
            end: newGroup.end
          }
        };
      }
    }

    return { conflict: false };
  } catch (error) {
    console.error("Error checking overlap:", error);
    return { conflict: false };
  }
}