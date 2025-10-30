// app/(backend)/GroupController/updateGroup.ts
"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { revalidatePath } from "next/cache";
import { getRandomTagColor } from "@/lib/tagColors";

/**
 * Convert an HTML <input type="datetime-local"> value (local wall-clock) to a UTC Date, 
 * assuming a fixed timezone offset (e.g., SGT = +08:00).
 */
function localDatetimeToUTC(local: string, offsetMinutes: number): Date {
  const norm = local.length === 16 ? `${local}:00` : local;
  const [datePart, timePart] = norm.split("T");
  if (!datePart || !timePart) return new Date(NaN);

  const [yStr, mStr, dStr] = datePart.split("-");
  const [hhStr, mmStr, ssStr] = timePart.split(":");

  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  const hour = Number(hhStr);
  const minute = Number(mmStr);
  const second = Number(ssStr ?? "0");

  if (
    !Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day) ||
    !Number.isFinite(hour) || !Number.isFinite(minute) || !Number.isFinite(second)
  ) {
    return new Date(NaN);
  }

  const msLocalAsUTC = Date.UTC(year, month - 1, day, hour, minute, second);
  const msUTC = msLocalAsUTC - offsetMinutes * 60_000;

  return new Date(msUTC);
}

/**
 * Check if user already has groups that overlap with the proposed time (excluding current group)
 */
async function checkHostTimeConflict(hostId: string, newStart: Date, newEnd: Date, excludeGroupId: string) {
  const existingGroups = await prisma.group.findMany({
    where: {
      hostId: hostId,
      isClosed: false,
      id: { not: excludeGroupId }, // Exclude the current group being edited
    },
    select: {
      id: true,
      name: true,
      start: true,
      end: true,
      location: true,
    },
  });

  for (const group of existingGroups) {
    const existingStart = new Date(group.start);
    const existingEnd = new Date(group.end);

    // Check for time overlap
    const hasOverlap = newStart < existingEnd && newEnd > existingStart;

    if (hasOverlap) {
      return {
        conflict: true,
        conflictingGroup: {
          id: group.id,
          name: group.name,
          start: group.start,
          end: group.end,
          location: group.location,
        },
      };
    }
  }

  return { conflict: false };
}

export async function updateGroup(formData: FormData) {
  const user = await requireUser();
  
  const groupId = String(formData.get("groupId") || "");
  const name = String(formData.get("name") || "").trim();
  const visibilityStr = String(formData.get("visibility") || "public");
  const startLocal = String(formData.get("start") || "");
  const endLocal = String(formData.get("end") || "");
  const location = String(formData.get("location") || "").trim();
  const capacity = parseInt(String(formData.get("capacity") || "2"), 10);

  const tagsInput = String(formData.get("tags") || "").trim();
  const tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);

  if (!groupId || !name || !location) throw new Error("Missing required fields");
  
  // Updated capacity validation: min 2, max 50
  if (!Number.isFinite(capacity) || capacity < 2) {
    throw new Error("Capacity must be at least 2 members");
  }
  if (capacity > 50) {
    throw new Error("Capacity cannot exceed 50 members");
  }
  
  if (!startLocal || !endLocal) throw new Error("Start/End required");

  // Tag validation
  if (tags.length === 0) {
    throw new Error("At least one tag is required");
  }
  if (tags.length > 5) {
    throw new Error("Maximum 5 tags allowed");
  }
  for (const tag of tags) {
    if (tag.length > 25) {
      throw new Error(`Tag "${tag}" exceeds 25 character limit`);
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(tag)) {
      throw new Error(`Tag "${tag}" can only contain letters, numbers, spaces, hyphens, and underscores`);
    }
  }

  if (!groupId || !name || !location) throw new Error("Missing required fields");
  if (name.length > 30) throw new Error("Group name cannot exceed 30 characters");

  // Check if user is the host of this group
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { hostId: true, currentSize: true }
  });

  if (!group) throw new Error("Group not found");
  if (group.hostId !== user.id) throw new Error("Only the host can edit this group");
  if (capacity < group.currentSize) throw new Error("Capacity cannot be less than current members");

  // SGT = UTC+8 → offset +480 minutes
  const SGT_OFFSET_MIN = 8 * 60;

  // Convert local wall-clock (SGT) to absolute UTC instants
  const start = localDatetimeToUTC(startLocal, SGT_OFFSET_MIN);
  const end = localDatetimeToUTC(endLocal, SGT_OFFSET_MIN);

  if (isNaN(+start)) throw new Error("Invalid start datetime");
  if (isNaN(+end)) throw new Error("Invalid end datetime");
  if (end <= start) throw new Error("End must be after start");

  // Check if host already has other groups at the same time
  const timeConflict = await checkHostTimeConflict(user.id, start, end, groupId);
  if (timeConflict.conflict && timeConflict.conflictingGroup) {
    const conflictingGroup = timeConflict.conflictingGroup;
    const conflictStart = new Date(conflictingGroup.start).toLocaleString();
    const conflictEnd = new Date(conflictingGroup.end).toLocaleString();
    
    throw new Error(
      `You already have a group "${conflictingGroup.name}" at ${conflictingGroup.location} during this time (${conflictStart} - ${conflictEnd}). You cannot host multiple groups at the same time.`
    );
  }

  // Update group in database
  const updatedGroup = await prisma.$transaction(async (tx) => {
    const group = await tx.group.update({
        where: { id: groupId },
        data: {
            name,
            location,
            start,
            end,
            capacity,
            visibility: visibilityStr === "public",
        },
    });

    await tx.tag.deleteMany({
      where: { groupId }
    });

    if (tags.length > 0) {
      await tx.tag.createMany({
        data: tags.map(tagName => ({
          name: tagName,
          color: getRandomTagColor(),
          groupId: group.id,
        })),
      });
    }

    return group;
  });

  revalidatePath("/groups");
  return updatedGroup;
}