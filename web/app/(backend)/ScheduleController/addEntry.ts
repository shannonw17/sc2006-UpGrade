import prisma from "@/lib/db";
import { readSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { viewSchedule } from "./viewSchedule";
import { deleteNotifs } from "../NotificationController/deleteNotifs";
import { Group } from "@prisma/client";

export async function addEntry() {
  const sessionId = await readSession();
  if (!sessionId) redirect("/login");

    const studyGroups = await viewSchedule();
    const validStudyGroups: Group[] = [];

  const now = Date.now();

  for (let i = 0; i < studyGroups.length; i++) {
    const group = studyGroups[i];
    const endTime = new Date(group.end).getTime();
    const expiryTime = endTime + 72 * 60 * 60 * 1000; // +72 hours

    if (now <= expiryTime) {
      validStudyGroups.push(group);
    } else {
        deleteNotifs(group.id);   // Delete expired study group

        
        // await prisma.groupMember.deleteMany({ where: { groupId: group.id } });
        // await prisma.group.delete({ where: { id: group.id } });
        // This is to remove all group members and the group itself from the database
        // Note: Not yet tested
    }
  }

  return validStudyGroups;
}
