import prisma from "@/lib/db";
import { readSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { deleteNotifs } from "../NotificationController/deleteNotifs";
import { Group } from "@prisma/client";
import { viewSchedule } from "./viewSchedule";




export async function cleanSchedule() {
    const sessionId = await readSession();
    if (!sessionId) redirect("/login");

    const studyGroups = await viewSchedule();
    const invalidStudyGroups: Group[] = [];
    const now = Date.now();

    for (let i = 0; i < studyGroups.length; i++) {
        const group = studyGroups[i];
        const endTime = new Date(group.end).getTime();
        const expiryTime = endTime + 72 * 60 * 60 * 1000; // +72 hours

        if (now >= expiryTime) {
            invalidStudyGroups.push(group);
        }
    
    }

    for (let i = 0; i < invalidStudyGroups.length; i++) {
        const group = invalidStudyGroups[i];
        
        /* Uncomment below to enable automatic deletion of expired study groups

        deleteNotifs(group.id); // Delete expired study group notifications

        await prisma.group.delete({ // Delete the group itself
            where: { id: group.id },
        });

        Not yet tested
        Not implemented anywhere yet
        */
    }
}
