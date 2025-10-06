"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cancelPending } from "../InvitationController/cancelPending";
import { checkOverlap } from "../ConflictController/checkOverlap";
import { resolveConflict } from "../ConflictController/resolveConflict";

// Demo: you probably have auth; wire your real user id here.
function getCurrentUserId() {
  // e.g., from session. For demo, hardcode or pass via form.
  return "cmg87rs3w0002vofsnekwzvyg"; // Test user
}

export async function joinGroup(formData: FormData) {
  const groupId = String(formData.get("groupId") || "");
  const userId  = String(formData.get("userId")  || getCurrentUserId());

  if (!groupId || !userId) throw new Error("Missing groupId or userId");

  //check for overlap
  const overlap = await checkOverlap(userId, groupId); //return conflict: Boolean

  if (overlap.conflict && overlap.conflictingGroup) {
    //to prompt user on frontend "This group timing overlaps with Group __. Leave Group __ to join this group?" - 2 options (confirm or cancel) 
    const choice = true; // how to get choice from frontend, assume click confirm sets boolean to true

    await resolveConflict(userId, overlap.conflictingGroup?.id, groupId, false, choice);
    return;
  }


  await prisma.$transaction(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: groupId },
      select: { capacity: true, currentSize: true },
    });
    if (!group) throw new Error("Group not found");

    if (group.currentSize >= group.capacity) {
      throw new Error("Group is full");
    }

    // Ensure not already a member
    const already = await tx.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (already) return;

    // Create membership and bump counter
    await tx.groupMember.create({ data: { groupId, userId } });
    await tx.group.update({
      where: { id: groupId },
      data: { currentSize: { increment: 1 } },
    });
    await cancelPending(groupId); //call to check if membership capacity reach --> clear pending invitations
  });

  revalidatePath("/groups");
}
