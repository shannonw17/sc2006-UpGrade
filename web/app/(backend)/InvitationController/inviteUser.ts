"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/requireUser";

type InviteError =
  | "missing-fields"
  | "group-not-found"
  | "forbidden"
  | "group-closed"
  | "group-full"
  | "user-not-found"
  | "cannot-invite-self"
  | "already-member"
  | "invite-already-sent"
  | "internal-error";

type InviteResult =
  | { ok: true; invitedUsername: string; inviteId: string }
  | { ok: false; error: InviteError };

export async function sendInvite(formData: FormData): Promise<InviteResult> {
  try {
    const me = await requireUser(); // sender

    const groupId = String(formData.get("groupId") ?? "");
    const receiverUsername = String(formData.get("receiverUsername") ?? "").trim();

    if (!groupId || !receiverUsername) {
      return { ok: false, error: "missing-fields" };
    }

    // Load group & basic state
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        isClosed: true,
        capacity: true,
        currentSize: true,
        hostId: true,
        members: { select: { userId: true } },
      },
    });
    if (!group) return { ok: false, error: "group-not-found" };

    // Look up receiver by username
    const receiver = await prisma.user.findUnique({
      where: { username: receiverUsername },
      select: { id: true, username: true },
    });
    if (!receiver) return { ok: false, error: "user-not-found" };
    if (receiver.id === me.id) return { ok: false, error: "cannot-invite-self" };

    // Permission: host or member can invite (tweak to host-only if you want)
    const canInvite = me.id === group.hostId || group.members.some((m) => m.userId === me.id);
    if (!canInvite) return { ok: false, error: "forbidden" };

    // State checks
    if (group.isClosed) return { ok: false, error: "group-closed" };
    if (group.currentSize >= group.capacity) return { ok: false, error: "group-full" };

    // Already member?
    if (group.members.some((m) => m.userId === receiver.id)) {
      return { ok: false, error: "already-member" };
    }

    // Existing invite?
    const existing = await prisma.invitation.findFirst({
      where: { receiverId: receiver.id, groupId: group.id },
      select: { id: true },
    });
    if (existing) return { ok: false, error: "invite-already-sent" };

    // Create invite + notification in a transaction
    const invite = await prisma.$transaction(async (tx) => {
      const inv = await tx.invitation.create({
        data: {
          senderId: me.id,
          receiverId: receiver.id,
          groupId: group.id,
        },
      });
      await tx.notification.create({
        data: {
          userId: receiver.id,
          type: "INVITE_RECEIVED",
          message: `You have been invited to join "${group.name}".`,
          invitationId: inv.id,
        },
      });
      return inv;
    });

    revalidatePath("/inbox");
    return { ok: true, invitedUsername: receiver.username, inviteId: invite.id };
  } catch (err) {
    console.error("sendInvite error:", err);
    return { ok: false, error: "internal-error" };
  }
}
