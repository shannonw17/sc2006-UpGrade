// called when rejectInvite() --> only sender of the invite receives this message
"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function rejectNotify(senderId: string, receiverId: string, groupId: string) {
  // fetch grp name for msg
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return;

  const receiverUser = await prisma.user.findUnique({ where: { id: receiverId } });
  const receivererUserName = receiverUser?.username ?? "Someone";

  await prisma.notification.create({
    data: {
      userId: senderId,
      type: "INVITE_REJECTED",
      message: `${receivererUserName} rejected your invite to join group "${group.name}(${groupId})".`,
    },
  });
  revalidatePath("/groups");
}
