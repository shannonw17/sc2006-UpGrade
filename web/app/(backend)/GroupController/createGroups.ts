// app/(backend)/GroupController/createGroups.ts
"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRandomTagColor } from "@/lib/tagColors";

/**
 * Convert an HTML <input type="datetime-local"> value (local wall-clock)
 * to a UTC Date, assuming a fixed timezone offset (e.g., SGT = +08:00).
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

function generateGroupID(length = 9) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Check if user already has groups that overlap with the proposed time
async function checkHostTimeConflict(hostId: string, newStart: Date, newEnd: Date) {
  const existingGroups = await prisma.group.findMany({
    where: {
      hostId: hostId,
      isClosed: false, 
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

export async function createGroup(formData: FormData) {
  const user = await requireUser();
  const hostId = user.id;

  const name = String(formData.get("name") || "").trim();
  const visibilityStr = String(formData.get("visibility") || "public");
  const startLocal = String(formData.get("start") || "");
  const endLocal = String(formData.get("end") || "");
  const location = String(formData.get("location") || "").trim();
  const capacity = parseInt(String(formData.get("capacity") || "2"), 10);

  const tagsInput = String(formData.get("tags") || "").trim();
  const tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);

  // Validation
  if (!name) throw new Error("Group name is required");
  if (!location) throw new Error("Location is required");
  
  // Check Capacity
  if (!Number.isFinite(capacity) || capacity < 2) {
    throw new Error("Capacity must be at least 2 members");
  }
  if (capacity > 50) {
    throw new Error("Capacity cannot exceed 50 members");
  }
  
  if (!startLocal) throw new Error("Start time is required");
  if (!endLocal) throw new Error("End time is required");

  // Check Tags
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

  if (!name) throw new Error("Group name is required");
  if (name.length > 30) throw new Error("Group name cannot exceed 30 characters");
  if (!location) throw new Error("Location is required");

  // SGT = UTC+8 
  const SGT_OFFSET_MIN = 8 * 60;

  // Convert local (SGT) to UTC
  const start = localDatetimeToUTC(startLocal, SGT_OFFSET_MIN);
  const end = localDatetimeToUTC(endLocal, SGT_OFFSET_MIN);

  if (isNaN(+start)) throw new Error("Invalid start datetime");
  if (isNaN(+end)) throw new Error("Invalid end datetime");
  if (end <= start) throw new Error("End time must be after start time");

  // Prevent creating groups in the past
  const nowUtc = new Date();
  if (start < nowUtc) throw new Error("Start time must be in the future");

  // Check if host already has groups at the same time
  const timeConflict = await checkHostTimeConflict(hostId, start, end);
  if (timeConflict.conflict) {
    const conflictingGroup = timeConflict.conflictingGroup;
    if (conflictingGroup) {
      const conflictStart = new Date(conflictingGroup.start).toLocaleString();
      const conflictEnd = new Date(conflictingGroup.end).toLocaleString();
      
      throw new Error(
        `You already have a group "${conflictingGroup.name}" at ${conflictingGroup.location} during this time (${conflictStart} - ${conflictEnd}). You cannot host multiple groups at the same time.`
      );
    } else {
      throw new Error("You already have a conflicting group at this time. You cannot host multiple groups at the same time.");
    }
  }

  // Ensure user exists
  const exists = await prisma.user.findUnique({ 
    where: { id: hostId }, 
    select: { id: true } 
  });
  if (!exists) throw new Error("Host user not found");

  // Generate unique groupID
  let groupID = generateGroupID();
  while (await prisma.group.findUnique({ where: { groupID } })) {
    groupID = generateGroupID();
  }

  await prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: {
        groupID,
        name,
        visibility: visibilityStr === "public",
        start,
        end,
        location,
        capacity,
        currentSize: 1,
        hostId,
      },
      select: { id: true },
    });

    // Create tags
    if (tags.length > 0) {
      await tx.tag.createMany({
        data: tags.map(tagName => ({
          name: tagName,
          color: getRandomTagColor(),
          groupId: group.id,
        })),
      });
    }

    // Check host membership
    await tx.groupMember.create({
      data: { userId: hostId, groupId: group.id },
    });
  });

  revalidatePath("/groups");
  redirect("/groups?tab=mine");
}