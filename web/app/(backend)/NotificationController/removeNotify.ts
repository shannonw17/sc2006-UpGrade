//inform members of the group when group is deleted due to reporting
//to create new notifcation type in prisma enum

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function removeNotify(groupId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return;

  //find members except the new user
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });

  if (members.length === 1) return; //ie. only host in group

  await prisma.notification.createMany({
    data: members.map((m) => ({
      userId: m.userId,
      type: "GROUP_REPORTED",
      message: `The group "${group.name} (${groupId}) has been deleted".`,
    })),
  });
  revalidatePath("/inbox");
}
