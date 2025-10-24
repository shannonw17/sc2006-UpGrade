// app/(backend)/GroupController/createGroups.ts
"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Convert an HTML <input type="datetime-local"> value (local wall-clock)
 * to a UTC Date, assuming a fixed timezone offset (e.g., SGT = +08:00).
 *
 * Accepts "YYYY-MM-DDTHH:MM" or "YYYY-MM-DDTHH:MM:SS".
 */
function localDatetimeToUTC(local: string, offsetMinutes: number): Date {
  // Normalize to include seconds if omitted
  // e.g., "2025-10-18T18:05" -> "2025-10-18T18:05:00"
  const norm = local.length === 16 ? `${local}:00` : local;

  // Basic parse
  // norm = YYYY-MM-DDTHH:MM:SS
  const [datePart, timePart] = norm.split("T");
  if (!datePart || !timePart) return new Date(NaN);

  const [yStr, mStr, dStr] = datePart.split("-");
  const [hhStr, mmStr, ssStr] = timePart.split(":");

  const year = Number(yStr);
  const month = Number(mStr);   // 1..12
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

  // Treat the components as "local" (SGT) and back out the offset to reach UTC.
  // UTC ms for the same wall-clock components:
  //   UTC = Local - offset
  // Using Date.UTC to avoid host timezone effects.
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

export async function createGroup(formData: FormData) {
  const user = await requireUser();
  const hostId = user.id;

  const name = String(formData.get("name") || "").trim();
  const visibilityStr = String(formData.get("visibility") || "public");
  const startDate = String(formData.get("startDate") || "");
  const startTime = String(formData.get("startTime") || "");
  const endDate = String(formData.get("endDate") || "");
  const endTime = String(formData.get("endTime") || "");

  // Combine date and time
  const startLocal = `${startDate}T${startTime}`;
  const endLocal = `${endDate}T${endTime}`;
  
  const location   = String(formData.get("location") || "").trim();
  const capacity   = parseInt(String(formData.get("capacity") || "2"), 10);

  if (!name || !location) throw new Error("Missing required fields");
  if (!Number.isFinite(capacity) || capacity < 1) throw new Error("Invalid capacity");
  if (!startLocal || !endLocal) throw new Error("Start/End required");

  // SGT = UTC+8 → offset +480 minutes
  const SGT_OFFSET_MIN = 8 * 60;

  // Convert local wall-clock (SGT) to absolute UTC instants (no libraries)
  const start = localDatetimeToUTC(startLocal, SGT_OFFSET_MIN);
  const end   = localDatetimeToUTC(endLocal,   SGT_OFFSET_MIN);

  if (isNaN(+start)) throw new Error("Invalid start datetime");
  if (isNaN(+end))   throw new Error("Invalid end datetime");
  if (end <= start)  throw new Error("End must be after start");

  // Optional: prevent creating groups in the past
  const nowUtc = new Date();
  if (start < nowUtc) throw new Error("Start time must be in the future");

  // ensure user exists
  const exists = await prisma.user.findUnique({ where: { id: hostId }, select: { id: true } });
  if (!exists) throw new Error("Host user not found");

  // unique groupID
  let groupID = generateGroupID();
  while (await prisma.group.findUnique({ where: { groupID } })) groupID = generateGroupID();

  await prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: {
        groupID,
        name,
        visibility: visibilityStr === "public",
        start,      // stored in UTC
        end,        // stored in UTC
        location,
        capacity,
        currentSize: 1,  // host counts
        hostId,          // FK to User.id
      },
      select: { id: true },
    });

    // Ensure host is also a member so they get reminders
    await tx.groupMember.create({
      data: { userId: hostId, groupId: group.id },
    });
  });

  revalidatePath("/groups");
  redirect("/groups?tab=mine");
}
