//Retrieve the Study Groups for a given User
// app/(backend)/ScheduleController/viewSchedule.ts
import prisma from "@/lib/db";
import { readSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function viewSchedule() {
    const session = await readSession();
    if (!session) redirect("/login");

    try {
        const groups = await prisma.groupMember.findMany({
            where: {
                userId: session.userId,
            },
            include: {
                group: true,
            },
        });
        
        const memberships = groups.map((g) => g.group);
        return memberships;
    } catch (error) {
        console.error("Error fetching schedule:", error);
        return [];
    }
}
