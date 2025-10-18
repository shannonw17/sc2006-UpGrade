"use server";

import prisma from "@/lib/db";
import { addMinutes } from "date-fns";

type WindowLabel = "24h" | "2h" | "15m";
const WINDOW_TO_MINUTES: Record<WindowLabel, number> = {
  "24h": 24 * 60,
  "2h":  2 * 60,
  "15m": 15,
};

// simple placeholder email sender
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  // Demo mode: just log to console.
  console.log(`[email → ${to}] ${subject}`);
}

/**
 * Sends both inbox + (optional) email reminders for groups starting soon.
 * Idempotent: tracked by EmailReminderLog unique([userId, groupId, window]).
 */
export async function sendGroupReminders(windowLabel: WindowLabel, toleranceMin = 2) {
  const now = new Date();
  const targetStartUTC = addMinutes(now, WINDOW_TO_MINUTES[windowLabel]);
  const targetEndUTC   = addMinutes(targetStartUTC, toleranceMin);

  const groups = await prisma.group.findMany({
    where: {
      isClosed: false,
      start: { gte: targetStartUTC, lt: targetEndUTC },
    },
    include: {
      members: { include: { user: true } },
    },
  });

  let sentEmails = 0;

  for (const g of groups) {
    const users = g.members.map(m => m.user).filter(Boolean);

    // Create inbox notifications (everyone gets one)
    if (users.length) {
      await prisma.notification.createMany({
        data: users.map(u => ({
          userId: u!.id,
          groupId: g.id,
          type: "GROUP_START_REMINDER",
          message: `Reminder: "${g.name}" starts at ${g.start.toISOString()} (UTC) @ ${g.location}`,
          // Optional: expiresAt: g.end
        })),
      });
    }

    // Email reminders (only for users with emailReminder = true)
    const toEmail = users.filter(u => u!.emailReminder);
    if (toEmail.length) {
      const existing = await prisma.emailReminderLog.findMany({
        where: {
          groupId: g.id,
          window: windowLabel,
          userId: { in: toEmail.map(u => u!.id) },
        },
        select: { userId: true },
      });
      const already = new Set(existing.map(e => e.userId));
      const fresh = toEmail.filter(u => !already.has(u!.id));

      for (const u of fresh) {
        await sendEmail({
          to: u!.email,
          subject: `Reminder: ${g.name} starts soon`,
          html: `
            <p>Hi ${u!.username},</p>
            <p>Your study group <strong>${g.name}</strong> will start on <strong>${g.start.toISOString()}</strong> (UTC).</p>
            <p>Location: ${g.location}</p>
            <p>Group ID: ${g.groupID}</p>
          `,
        });

        await prisma.emailReminderLog.create({
          data: { userId: u!.id, groupId: g.id, window: windowLabel },
        });
        sentEmails++;
      }
    }
  }

  return { ok: true, checkedGroups: groups.length, sentEmails };
}
