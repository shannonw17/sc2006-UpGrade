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

  const confirmResolve = String(formData.get("confirmResolve") || "false") === "true";

  // --- Step 0: Is user already in this group? ---------------------------------
  const existingMembership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
    select: { userId: true, groupId: true },
  });

  if (existingMembership) {
    // User already in the target group: ensure no conflicts with other groups.
    const overlap = await checkOverlap(userId, groupId);
    if (overlap.conflict && overlap.conflictingGroup) {
      if (!confirmResolve) {
        throw new Error(
          "This group's time overlaps with another group you're in. Please confirm to leave the conflicting group."
        );
      }

      // Switch away from the conflicting (old) group, keep membership in this (new) group.
      // resolveConflict will notify and revalidate internally.
      await resolveConflict(
        userId,
        overlap.conflictingGroup.id, // oldGroupId
        groupId,                     // newGroupId (this group)
        /* isInvite */ false,
        /* userConfirmed */ true
      );
    }

    // Already a member (and either resolved or no conflict) → nothing else to do.
    revalidatePath("/groups");
    revalidatePath("/inbox");
    return;
  }

  // --- Step 1: Not yet a member → check overlap BEFORE joining ----------------
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

    // ResolveConflict already did the join + notifications + revalidate
    // but we still revalidate here (harmless) for safety.
    revalidatePath("/groups");
    revalidatePath("/inbox");
    return;
  }

  // --- Step 2: Normal join path (no conflict) ---------------------------------
  let didJoinHere = false;
  await prisma.$transaction(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: groupId },
      select: { capacity: true, currentSize: true, isClosed: true },
    });
    if (!group) throw new Error("Group not found");
    if (group.isClosed) throw new Error("Group is closed");
    if (group.currentSize >= group.capacity) throw new Error("Group is full");

    const already = await tx.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (already) return; // Idempotent: someone else joined the user meanwhile

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
