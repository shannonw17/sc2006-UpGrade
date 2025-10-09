// app/(backend)/GroupController/createGroups.ts
"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  const startStr = String(formData.get("start") || "");
  const endStr = String(formData.get("end") || "");
  const location = String(formData.get("location") || "").trim();
  const capacity = parseInt(String(formData.get("capacity") || "2"), 10);

  if (!name || !location) throw new Error("Missing required fields");
  if (!Number.isFinite(capacity) || capacity < 1) throw new Error("Invalid capacity");

  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(+start)) throw new Error("Invalid start datetime");
  if (isNaN(+end)) throw new Error("Invalid end datetime");
  if (end <= start) throw new Error("End must be after start");

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
        start,
        end,
        location,
        capacity,
        currentSize: 1,    // host counts
        hostId,            // FK to User.id
      },
      select: { id: true },
    });

    await tx.groupMember.create({
      data: { userId: hostId, groupId: group.id },
    });
  });

  revalidatePath("/groups");
  redirect("/groups?tab=mine");
}
