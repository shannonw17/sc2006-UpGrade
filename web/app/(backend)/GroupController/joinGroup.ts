"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cancelPending } from "../InvitationController/cancelPending";
import { checkOverlap } from "../ConflictController/checkOverlap";
import { resolveConflict } from "../ConflictController/resolveConflict";
import { joinNotify } from "../NotificationController/joinNotify";
import { requireUser } from "@/lib/requireUser";

export async function joinGroup(formData: FormData) {

  const user = await requireUser();
  const userId = user.id;
  const groupId = String(formData.get("groupId") || "");

  if (!groupId || !userId) throw new Error("Missing groupId or userId");

  // Optional: read user's choice from the form (e.g., a hidden input set by your modal)
  // <input type="hidden" name="confirmResolve" value="true" />
  const confirmResolve = String(formData.get("confirmResolve") || "false") === "true";

  // 1) Check for timing overlap
  const overlap = await checkOverlap(userId, groupId); // { conflict: boolean, conflictingGroup?: { id: string } }

  if (overlap.conflict && overlap.conflictingGroup) {
    // If you use a UI confirm, only resolve if the user confirmed
    if (!confirmResolve) {
      // Surface to the UI however you prefer (throw, return structured error, etc.)
      throw new Error(
        `This group overlaps with another group you're in. Ask user to confirm before proceeding.`
      );
    }
    // Resolve: leave conflicting group, then proceed to join target group
    await resolveConflict(userId, overlap.conflictingGroup.id, groupId, /*silent*/ false, /*choice*/ true);
    // Note: resolveConflict should handle membership changes. If it *already* joined the new group,
    // you can return here or fall through (idempotency below will no-op).
  }

  // 2) Join inside a transaction
  let didJoin = false;
  await prisma.$transaction(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: groupId },
      select: { capacity: true, currentSize: true, isClosed: true },
    });
    if (!group) throw new Error("Group not found");
    if (group.isClosed) throw new Error("Group is closed");
    if (group.currentSize >= group.capacity) throw new Error("Group is full");

    // Prevent duplicate membership
    const already = await tx.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (already) return; // idempotent: nothing to do

    // Create membership + bump size
    await tx.groupMember.create({ data: { groupId, userId } });
    await tx.group.update({
      where: { id: groupId },
      data: { currentSize: { increment: 1 } },
    });

    // Clear pending invites if capacity reached (your existing logic)
    await cancelPending(groupId);

    didJoin = true;
  });

  // 3) Notify everyone else (outside the transaction)
  if (didJoin) {
    await joinNotify(groupId, userId);
  }

  // 4) Revalidate UI
  revalidatePath("/groups");
  revalidatePath("/inbox");
}
