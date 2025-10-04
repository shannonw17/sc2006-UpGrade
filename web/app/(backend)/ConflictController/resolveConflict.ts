// when conflict: true in checkOverlap.ts --> decide to join new grp and leave old grp OR dont join new grp (+ reject invite)

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cancelPending } from "../InvitationController/cancelPending";
import { leaveNotify } from "../NotificationController/leaveNotify";
import { joinNotify } from "../NotificationController/joinNotify";
import { rejectInviteById } from "../InvitationController/rejectInvite";

export async function resolveConflict(
    userId: string,
    oldGroupId: string,
    newGroupId: string,
    isInvite: boolean,
    userConfirmed: boolean
) {
    if (!userConfirmed) { //decides not to join new grp (+ reject inv)
        if (isInvite) await rejectInviteById(userId, newGroupId); //to check this!
        return { success: false, reason: "User declined to leave existing group." };
    }

    await prisma.$transaction(async (tx) => {
        //remove from old grp
        await tx.groupMember.deleteMany({
            where: { userId, groupId: oldGroupId },
        });
        await tx.group.update({
            where: { id: oldGroupId },
            data: { currentSize: { decrement: 1 } },
        });
        //add to new grp
        await tx.groupMember.create({
            data: { userId, groupId: newGroupId },
        });
        await tx.group.update({
            where: { id: newGroupId },
            data: { currentSize: { increment: 1 } },
        });
    });
    //notify old and new grps
    await Promise.all([
        leaveNotify(oldGroupId, userId),
        joinNotify(newGroupId, userId),
    ]);

    //check if capacity exceed --> clear pending invites
    await cancelPending(newGroupId);

    revalidatePath("/groups");
    return { success: true };
}