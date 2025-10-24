// app/(backend)/GroupController/updateGroup.ts
"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { revalidatePath } from "next/cache";

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

export async function updateGroup(formData: FormData) {
  const user = await requireUser();
  
  const groupId = String(formData.get("groupId") || "");
  const name = String(formData.get("name") || "").trim();
  const startLocal = String(formData.get("start") || "");
  const endLocal = String(formData.get("end") || "");
  const location = String(formData.get("location") || "").trim();
  const capacity = parseInt(String(formData.get("capacity") || "2"), 10);

  if (!groupId || !name || !location) throw new Error("Missing required fields");
  if (!Number.isFinite(capacity) || capacity < 1) throw new Error("Invalid capacity");
  if (!startLocal || !endLocal) throw new Error("Start/End required");

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

  // Update group in database
  const updatedGroup = await prisma.group.update({
    where: { id: groupId },
    data: {
      name,
      location,
      start,
      end,
      capacity,
    },
  });

  revalidatePath("/groups");
  return updatedGroup;
}