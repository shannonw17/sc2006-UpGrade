//if pass group.start or reach capacity or host close grp early (assuming there is boolean attribute isClosed) --> expire --> delete from database

//ensure this is always called when above 3 situations take place 

"use server";

import prisma from "@/lib/db";

export async function cancelPending(groupId?: string) {
    const now = new Date();

    // helper fn to delete notifs and invites (db) for specific inviteId
    async function deleteInvAndNotif(inviteIds: string[]) {
        if (inviteIds.length === 0) return 0;
        await prisma.$transaction([
            prisma.notification.deleteMany({ where: { invitationId: { in: inviteIds } } }), 
            prisma.invitation.deleteMany({ where: { id: {in: inviteIds } } }), 
        ]);
        return inviteIds.length;
    }

    if (groupId) {
        const group = await prisma.group.findUnique({ where: { id: groupId } });
        if (!group) return { success: false, reason: "group-not-found" };
    
        const shouldExpire =
            group.start <= now || group.currentSize >= group.capacity || group.isClosed === true;
    
        if (!shouldExpire) return { success: true, expiredCount: 0 };
    
        const invites = await prisma.invitation.findMany({ where: { groupId } });
        const ids = invites.map((i) => i.id);
        const deleted = await deleteInvAndNotif(ids);
        return { success: true, expiredCount: deleted };
      }
    
    // Global mode: find all pending invites and filter those whose group meets the expire conditions
    const pending = await prisma.invitation.findMany({ include: { group: true } });
    const toExpire = pending.filter((inv) => {
        const g = inv.group;
        return g.start <= now || g.currentSize >= g.capacity || g.isClosed === true;
    });
    
    const ids = toExpire.map((i) => i.id);
    const deleted = await deleteInvAndNotif(ids);
    return { success: true, expiredCount: deleted };
}