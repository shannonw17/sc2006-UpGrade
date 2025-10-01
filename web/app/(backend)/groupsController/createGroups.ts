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

  const capacity = Number.parseInt(capacityStr, 10);
  const visibility = visibilityStr === "public"; // true = public, false = private
  const start = new Date(startStr);
  const end = new Date(endStr);

  // generate unique groupID
  let groupID = generateGroupID();
  while (await prisma.group.findUnique({ where: { groupID } })) {
    groupID = generateGroupID();
  }

  await prisma.group.create({
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

  // revalidate group list & redirect
  revalidatePath("/groups");
  redirect("/groups");
}