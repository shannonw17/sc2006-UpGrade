"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function generateGroupID(length = 9) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createGroup(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const visibilityStr = String(formData.get("visibility") || "public");
  const startStr = String(formData.get("start") || "");
  const endStr = String(formData.get("end") || "");
  const location = String(formData.get("location") || "").trim();
  const capacityStr = String(formData.get("capacity") || "2");
  const hostId = String(formData.get("hostId") || "").trim();

  // basic validation (optional but helpful)
  const capacity = Number.parseInt(capacityStr, 10);
  if (!hostId) throw new Error("Missing hostId");
  if (!name || !location) throw new Error("Missing required fields");
  if (!Number.isFinite(capacity) || capacity < 1) throw new Error("Invalid capacity");

  const visibility = visibilityStr === "public"; // true = public, false = private
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (!(start instanceof Date) || isNaN(+start)) throw new Error("Invalid start datetime");
  if (!(end instanceof Date) || isNaN(+end)) throw new Error("Invalid end datetime");
  if (end <= start) throw new Error("End must be after start");

  // Generate unique groupID first
  let groupID = generateGroupID();
  while (await prisma.group.findUnique({ where: { groupID } })) {
    groupID = generateGroupID();
  }

  await prisma.$transaction(async (tx) => {
    // 1) Create the group (currentSize defaults to 1 in your schema)
    const group = await tx.group.create({
      data: {
        groupID,
        name,
        visibility,
        start,
        end,
        location,
        capacity,
        hostId,
      },
    });

    // 2) Make the host an actual member (to match currentSize)
    // Do NOT increment currentSize here since default is already 1.
    await tx.groupMember.create({
      data: { userId: hostId, groupId: group.id },
    });
  });

  // Revalidate & go to "My groups" tab so the user sees their new group
  revalidatePath("/groups");
  redirect("/groups?tab=mine");
}
