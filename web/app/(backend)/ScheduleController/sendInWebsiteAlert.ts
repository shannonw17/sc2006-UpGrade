import prisma from "@/lib/db";
import { readSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { viewSchedule } from "./viewSchedule";


export async function sendInWebsiteAlert() {
    const sessionId = await readSession();
    if (!sessionId) redirect("/login");

    const studyGroups = await viewSchedule();
    const messages: string[] = [];
    const now = Date.now();

    for (let i = 0; i < studyGroups.length; i++) {
      const group = studyGroups[i];
      const startTime = new Date(group.start).getTime();
      const timeDiff = startTime - now;

      const oneHour = 60 * 60 * 1000;
      const oneDay = 24 * oneHour; // 24 hours in a day
      const fiveDays = 5 * oneDay; // 5 days in milliseconds

      if (timeDiff > 0 && timeDiff < fiveDays) {
        messages.push(`Reminder: Your study group "${group.name}" starts in less than five days!`);
      }
    }
    return messages;
}