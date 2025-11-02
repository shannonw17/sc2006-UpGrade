// notify all members in grp when new member join
"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function joinNotify(groupId: string, newUserId: string) {
  // fetch grp name for msg
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return;

  // find members except the new user
  const members = await prisma.groupMember.findMany({
    where: { groupId, userId: { not: newUserId } },
    select: { userId: true },
  });

  if (members.length === 0) return; //ie. first to join grp, unlikely case though as most likely the 1st to join grp = host of the grp, regardless public or private

  const newUser = await prisma.user.findUnique({ where: { id: newUserId } });
  const newUserName = newUser?.username ?? "Someone"; //Someone is placeholder in case user does not specify a name --> unlikely case as name field should be compulsory --> to check mandatory fields 

  await prisma.notification.createMany({
    data: members.map((m) => ({
      userId: m.userId,
      groupId: groupId,
      type: "GROUP_MEMBER_JOINED",
      message: `${newUserName} has joined "${group.name}".`,
    })),
  });
  revalidatePath("/inbox");
}
