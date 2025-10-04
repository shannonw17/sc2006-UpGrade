// to add in acceptInvite.ts and joinGroup.ts

// check if time range of grp abt to be joined conflicts with any grps user is currently a member of

"use server";

import prisma from "@/lib/db";

export async function checkOverlap(userId: string, newGroupId: string) {
    const newGrp = await prisma.group.findUnique({
        where: { id:  newGroupId },
        select: { id: true, name: true, start: true, end: true },
    }); //get the details of new grp from database

    if (!newGrp) throw new Error("New group not found");

    const userGrps = await prisma.groupMember.findMany({
        where: { userId },
        include: {
            group: { select: { id: true, name: true, start: true, end: true }}
        },
    });

    for (const membership of userGrps) { //loop through all groups user has joined
        const g = membership.group;
        const overlap = g.start < newGrp.end && g.end > newGrp.start; //boolean

        if (overlap) {
            return {
                conflict: true,
                conflictingGroup: {id: g.id, name: g.name},
            };
        }
    }
    return { conflict: false };
}