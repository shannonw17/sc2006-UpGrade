// app/(backend)/GroupController/deleteGroup.ts
"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteGroup(formData: FormData) {
  const user = await requireUser();
  const groupId = String(formData.get("groupId") || "");

  if (!groupId) throw new Error("Missing groupId");

  // 1) Verify ownership
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, hostId: true, name: true },
  });
  if (!group) throw new Error("Group not found");
  if (group.hostId !== user.id) throw new Error("Unauthorized");

  // 2) Delete (relations are set to cascade in your schema)
  await prisma.group.delete({ where: { id: groupId } });

  // 3) Refresh lists & send host back to their groups
  revalidatePath("/groups");
  revalidatePath("/inbox");
  
  // Return success instead of redirecting
  return { success: true, message: `Group "${group.name}" deleted successfully` };
}