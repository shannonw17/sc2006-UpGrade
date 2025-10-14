"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cancelPending } from "../InvitationController/cancelPending";
import { checkOverlap } from "../ConflictController/checkOverlap";
import { resolveConflict } from "../ConflictController/resolveConflict";
import { joinNotify } from "../NotificationController/joinNotify";
import { requireUser } from "@/lib/requireUser";
import { checkGroupStatus } from "../ConflictController/checkGroupStatus";

export async function joinGroup(formData: FormData) {
  const user = await requireUser();
  const userId = user.id;
  const groupId = String(formData.get("groupId") || "");
  if (!groupId || !userId) throw new Error("Missing groupId or userId");

  const confirmResolve = String(formData.get("confirmResolve") || "false") === "true";

  // --- Step 1: Is user already in this group? ---------------------------------
  const existingMembership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
    select: { userId: true, groupId: true },
  });

  if (existingMembership) {
    // Already in target group: at most resolve overlap with some other group.
    const overlap = await checkOverlap(userId, groupId);
    if (overlap.conflict && overlap.conflictingGroup) {
      if (!confirmResolve) {
        throw new Error(
          "This group's time overlaps with another group you're in. Please confirm to leave the conflicting group."
        );
      }
      // Leave the conflicting (old) group; keep membership in this group.
      await resolveConflict(
        userId,
        overlap.conflictingGroup.id, // oldGroupId
        groupId,                     // newGroupId (this group)
        /* isInvite */ false,
        /* userConfirmed */ true
      );
    }

    // Nothing to join; just refresh UI.
    revalidatePath("/groups");
    revalidatePath("/inbox");
    return;
  }

  // --- Step 2: Not yet a member → guard with group status ---------------------
  // Use the shared helper: only proceed if group is open, not full, and not expired.
  const ok = await checkGroupStatus(groupId);
  if (!ok) throw new Error("Group is closed, full, or expired");

  // Before we actually join, also check overlap so we can resolve via resolveConflict.
  const overlap = await checkOverlap(userId, groupId);
  if (overlap.conflict && overlap.conflictingGroup) {
    if (!confirmResolve) {
      throw new Error(
        "This group overlaps with another group you're in. Please confirm to leave the conflicting group."
      );
    }

    // Resolve conflict by leaving old and joining this group (resolveConflict also notifies).
    await resolveConflict(
      userId,
      overlap.conflictingGroup.id, // oldGroupId
      groupId,                     // newGroupId
      /* isInvite */ false,
      /* userConfirmed */ true
    );

    // resolveConflict already did join + notifications + (likely) revalidate.
    // Revalidate again is harmless.
    revalidatePath("/groups");
    revalidatePath("/inbox");
    return;
  }

  // --- Step 3: Normal join path (no conflict) ---------------------------------
  let didJoinHere = false;
  await prisma.$transaction(async (tx) => {
    // Re-check state inside the transaction to avoid races
    const group = await tx.group.findUnique({
      where: { id: groupId },
      select: { capacity: true, currentSize: true, isClosed: true, start: true },
    });
    if (!group) throw new Error("Group not found");
    if (group.isClosed) throw new Error("Group is closed");
    if (group.currentSize >= group.capacity) throw new Error("Group is full");
    if (!group.start || group.start <= new Date()) throw new Error("Group has expired");

    const already = await tx.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (already) return; // someone added them meanwhile (idempotent)

    await tx.groupMember.create({ data: { groupId, userId } });
    await tx.group.update({
      where: { id: groupId },
      data: { currentSize: { increment: 1 } },
    });

    await cancelPending(groupId); // if capacity reached, clear pending
    didJoinHere = true;
  });

  // Only notify if the join happened here (resolveConflict already notifies)
  if (didJoinHere) {
    await joinNotify(groupId, userId);
  }

  // Final revalidate
  revalidatePath("/groups");
  revalidatePath("/inbox");
}
