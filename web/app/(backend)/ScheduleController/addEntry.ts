// app/(backend)/ScheduleController/addEntry.ts
import prisma from "@/lib/db";
import { readSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { viewSchedule } from "./viewSchedule";
import { Group } from "@prisma/client";

export async function addEntry() {
    const session = await readSession();
    if (!session) redirect("/login");

    try {
        const studyGroups = await viewSchedule();
        const validStudyGroups: Group[] = [];
        const invalidStudyGroups: Group[] = [];

        const now = Date.now();

        for (let i = 0; i < studyGroups.length; i++) {
            const group = studyGroups[i];
            if (!group || !group.end) continue;
            
            const endTime = new Date(group.end).getTime();
            const expiryTime = endTime + 72 * 60 * 60 * 1000; // +72 hours

            if (now <= expiryTime) {
                validStudyGroups.push(group);
            } else {
                invalidStudyGroups.push(group);
            }
        }

        return validStudyGroups;
    } catch (error) {
        console.error("Error in addEntry:", error);
        return [];
    }
}