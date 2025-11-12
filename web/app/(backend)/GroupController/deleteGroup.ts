// app/(backend)/GroupController/deleteGroup.ts
"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { revalidatePath } from "next/cache";
import { deleteNotifs } from "@/app/(backend)/NotificationController/deleteNotifs";

type DeleteOptions = {
  purgeMemberNotifs?: boolean; 
};
 
// Core delete function used by various delete scenarios
async function _deleteGroupCore(groupId: string, opts: DeleteOptions = {}) {
  const grp = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, name: true },
  });
  if (!grp) return { deleted: 0, name: "" };

 //Purge member notifications if specified
  if (opts.purgeMemberNotifs) {
    try {
      await deleteNotifs(groupId);
    } catch (e) {
      console.error(`[deleteGroup] deleteNotifs failed for group=${groupId}`, e);
    }
  }

  await prisma.group.delete({ where: { id: groupId } });

  revalidatePath("/groups");
  revalidatePath("/inbox");

  return { deleted: 1, name: grp.name };
}


//User-initiated delete (from UI)
export async function deleteGroup(formData: FormData) {
  const user = await requireUser();
  const groupId = String(formData.get("groupId") || "");
  if (!groupId) throw new Error("Missing groupId");

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, hostId: true, name: true },
  });
  if (!group) throw new Error("Group not found");
  if (group.hostId !== user.id) throw new Error("Unauthorized");

  const res = await _deleteGroupCore(groupId, { purgeMemberNotifs: false });
  return {
    success: true,
    message: `Group "${group.name}" deleted successfully`,
    deleted: res.deleted,
  };
}


//cron/admin cleanup, skips requireUser.
//Automated cleanup of expired/closed groups.
 
export async function deleteGroupSystem(groupId: string) {
  if (!groupId) return { deleted: 0, message: "Missing groupId" };
  const res = await _deleteGroupCore(groupId, { purgeMemberNotifs: false });
  return {
    success: true,
    deleted: res.deleted,
    message: res.deleted ? `Group "${res.name}" deleted (system).` : "Group not found",
  };
}

//Admin-ban delete. 
export async function deleteGroupByAdminBan(groupId: string) {
  if (!groupId) return { deleted: 0, message: "Missing groupId" };
  const res = await _deleteGroupCore(groupId, { purgeMemberNotifs: true });
  return {
    success: true,
    deleted: res.deleted,
    message: res.deleted ? `Group "${res.name}" deleted (admin ban).` : "Group not found",
  };
}
