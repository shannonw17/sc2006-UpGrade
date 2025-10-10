//differentiate b/w host user vs. reporting user
"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function warnUser(userId: string, isHost: boolean, groupId: string){
    const user = await prisma.user.update({ 
        where: { id: userId},
        data: { warning: true}, 
    });

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new Error("Group not found");

    if (isHost) {
        //send notification to warn host
        await prisma.notification.create({
            data: {
            userId: userId,
            type: "WARNING",
            message: `Your created group "${group.name}" has been reported and removed. Please follow the group creation guidelines. Further violations may result in a ban.`,
            },
        });
    } else {
        //send notification to warn reporting user
        await prisma.notification.create({
            data: {
            userId: userId,
            type: "WARNING",
            message: `Your report on group "${group.name}" is invalid. Please report the group only if it violates the group creation guidelines. Further false reporting may result in a ban.`,
            },
        });
    }
    revalidatePath("/inbox");
    return user;
}