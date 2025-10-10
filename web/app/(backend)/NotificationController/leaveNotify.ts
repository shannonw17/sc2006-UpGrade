"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function leaveNotify(groupId: string, leavingUserId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return;

  const leavingUser = await prisma.user.findUnique({ where: { id: leavingUserId } });
  const leavingName = leavingUser?.username ?? "Someone";

  const members = await prisma.groupMember.findMany({
    where: { groupId, userId: { not: leavingUserId } },
    select: { userId: true },
  });

  if (members.length === 0) return;

  await prisma.notification.createMany({
    data: members.map((m) => ({
      userId: m.userId,
      type: "GROUP_MEMBER_LEFT",
      message: `${leavingName} has left "${group.name} (${groupId})".`,
    })),
  });

  await prisma.notification.create({
  data: {
    userId: leavingUserId,
    groupId: groupId,
    type: "GROUP_MEMBER_LEFT",
    message: `You have left "${group.name} (${groupId})".`,
  },
});

  revalidatePath("/inbox");
}
