//delete all group related notifications of all group members in group ie. GROUP_MEMBER_JOINED, GROUP_MEMBER_LEFT, GROUP_START_REMINDER
//call when group is removed due to ban, dont remove GROUP_REPORTED

"use server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function deleteNotifs(groupId: string){
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return; 

    const members = await prisma.groupMember.findMany({
        where: { groupId} ,
        select: { userId: true },
    });
    if (members.length === 0) return;
    
    const membersIds = members.map((m)=> m.userId);

    await prisma.notification.deleteMany({
        where: {
            userId: {in: membersIds},
            groupId: groupId,
            type: {in: ["GROUP_MEMBER_JOINED", "GROUP_MEMBER_LEFT", "GROUP_START_REMINDER", "INVITE_REJECTED"]},
        },
    });
    revalidatePath("/inbox");
}

//delete all group related notifs when particular user leave grp -> call in leaveGroup.ts
export async function deleteNotif(userId: string, groupId: string){
    await prisma.notification.deleteMany({
        where: {
            userId: userId,
            groupId: groupId,
            type: {in: ["GROUP_MEMBER_JOINED", "GROUP_MEMBER_LEFT", "GROUP_START_REMINDER", "INVITE_REJECTED"]},
        },
    });
    revalidatePath("/inbox");
}