// to add in acceptInvite.ts and joinGroup.ts

// check if time range of grp abt to be joined conflicts with any grps user is currently a member of

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
      console.log(`[checkOverlap] New group ${newGroupId} not found`);
      return { conflict: false };
    }

    console.log(`[checkOverlap] Checking overlap for user ${userId} joining group "${newGroup.name}"`);
    console.log(`[checkOverlap] New group time: ${newGroup.start} to ${newGroup.end}`);

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

    console.log(`[checkOverlap] User is in ${userGroups.length} groups`);

    // Check for overlaps with each existing group
    for (const existingGroup of userGroups) {
      // Skip the same group (in case user is re-joining)
      if (existingGroup.id === newGroupId) {
        console.log(`[checkOverlap] Skipping same group: ${existingGroup.name}`);
        continue;
      }

      // Check if time periods overlap
      const newStart = new Date(newGroup.start);
      const newEnd = new Date(newGroup.end);
      const existingStart = new Date(existingGroup.start);
      const existingEnd = new Date(existingGroup.end);

      console.log(`[checkOverlap] Comparing with "${existingGroup.name}": ${existingStart} to ${existingEnd}`);

      // Check for overlap: if one group starts before the other ends and ends after the other starts
      const hasOverlap = newStart < existingEnd && newEnd > existingStart;

      if (hasOverlap) {
        console.log(`[checkOverlap] OVERLAP DETECTED between "${newGroup.name}" and "${existingGroup.name}"`);
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

    console.log(`[checkOverlap] No overlaps found`);
    return { conflict: false };
  } catch (error) {
    console.error("[checkOverlap] Error checking overlap:", error);
    return { conflict: false };
  }
}

export async function checkOverlapRange(
  userId: string,
  newStart: Date,
  newEnd: Date,
  skipGroupId?: string
) {
  try {
    const overlapping = await prisma.group.findFirst({
      where: {
        OR: [
          { hostId: userId },
          { members: { some: { userId } } },
        ],
        isClosed: false,
        AND: [
          { start: { lt: newEnd } }, // existing starts before new ends
          { end:   { gt: newStart } }, // existing ends after new starts
        ],
        ...(skipGroupId ? { id: { not: skipGroupId } } : {}),
      },
      select: {
        id: true, name: true, start: true, end: true, location: true,
      },
    });

    if (overlapping) {
      return {
        conflict: true,
        conflictingGroup: {
          id: overlapping.id,
          name: overlapping.name,
          start: overlapping.start,
          end: overlapping.end,
          location: overlapping.location,
        },
      };
    }

    return { conflict: false };
  } catch (err) {
    console.error("[checkOverlapRange] Error:", err);
    // Be conservative: if something goes wrong, allow creation to proceed
    return { conflict: false };
  }
}