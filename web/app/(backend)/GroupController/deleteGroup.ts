// app/(backend)/GroupController/deleteGroup.ts
"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { revalidatePath } from "next/cache";
import { deleteNotifs } from "@/app/(backend)/NotificationController/deleteNotifs";

type DeleteOptions = {
  /** When true, also delete member notifs (JOINED/LEFT/START_REMINDER/INVITE_REJECTED). */
  purgeMemberNotifs?: boolean; // use for admin-ban or system removals
};

/**
 * Internal core delete that assumes authorization has already been checked.
 * Used by both the user action and the system (cron/admin) cleanup.
 */
async function _deleteGroupCore(groupId: string, opts: DeleteOptions = {}) {
  const grp = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, name: true },
  });
  if (!grp) return { deleted: 0, name: "" };

  // If requested (e.g., admin ban), purge member notifications for this group
  if (opts.purgeMemberNotifs) {
    try {
      await deleteNotifs(groupId);
    } catch (e) {
      console.error(`[deleteGroup] deleteNotifs failed for group=${groupId}`, e);
      // continue with deletion anyway
    }
  }

  // Relations are set to cascade in your schema
  await prisma.group.delete({ where: { id: groupId } });

  // Lightweight cache busts (safe no-ops outside of a request too)
  revalidatePath("/groups");
  revalidatePath("/inbox");

  return { deleted: 1, name: grp.name };
}

/**
 * User-initiated delete (from UI). Requires ownership.
 * Default: do NOT purge member notifs (keeps users' feed unless it's an admin ban).
 */
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

/**
 * System-initiated delete (cron/admin cleanup). Skips requireUser.
 * Use for automated cleanup of expired/closed groups (no notif purge by default).
 */
export async function deleteGroupSystem(groupId: string) {
  if (!groupId) return { deleted: 0, message: "Missing groupId" };
  const res = await _deleteGroupCore(groupId, { purgeMemberNotifs: false });
  return {
    success: true,
    deleted: res.deleted,
    message: res.deleted ? `Group "${res.name}" deleted (system).` : "Group not found",
  };
}

/**
 * Admin-ban delete. Purges member notifs (JOINED/LEFT/START_REMINDER/INVITE_REJECTED)
 * but intentionally leaves GROUP_REPORTED (your deleteNotifs() already excludes it).
 */
export async function deleteGroupByAdminBan(groupId: string) {
  if (!groupId) return { deleted: 0, message: "Missing groupId" };
  const res = await _deleteGroupCore(groupId, { purgeMemberNotifs: true });
  return {
    success: true,
    deleted: res.deleted,
    message: res.deleted ? `Group "${res.name}" deleted (admin ban).` : "Group not found",
  };
}
