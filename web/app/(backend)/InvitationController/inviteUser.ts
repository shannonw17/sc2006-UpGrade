//to be linked when button is clicked in group/page.tsx
"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/requireUser";

export async function sendInvite(formData: FormData) {
  const user = await requireUser(); // sender --> not sure if should use getCurrentUserId() like in joinGroup.ts, demo? idk
  const senderId = user.id;
  const receiverId = String(formData.get("receiverId") || "");
  const groupId = String(formData.get("groupId") || "");
  const group = await prisma.group.findUnique({ where: { id: groupId } });

  if (!receiverId || !groupId) throw new Error("Missing receiverId or groupId");
  if (!group) throw new Error("Group not found");

  // Create invitation
  const invite = await prisma.invitation.create({
    data: {
      senderId,
      receiverId,
      groupId,
    },
  });

  // Create inbox notification that references the invitation
  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: "INVITE_RECEIVED",
      message: `${user.username} has invited you to join group "${group.name}".`,
      invitationId: invite.id,
    },
  });
  
  revalidatePath("/groups");
  return invite;
}
