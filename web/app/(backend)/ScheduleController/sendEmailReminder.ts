"use server";

import prisma from "@/lib/db";
import { addMinutes, startOfMinute } from "date-fns";

type WindowLabel = "24h" | "2h" | "15m";
const WINDOW_TO_MINUTES: Record<WindowLabel, number> = {
  "24h": 24 * 60,
  "2h":  2 * 60,
  "15m": 15,
};

// Round a Date down to the nearest 5-minute boundary (UTC)
function floorTo5Min(d: Date) {
  const m = startOfMinute(d);
  const mins = m.getUTCMinutes();
  m.setUTCMinutes(Math.floor(mins / 5) * 5, 0, 0);
  return m;
}

// simple placeholder email sender
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  console.log(`[email → ${to}] ${subject}`);
}



export async function sendInWebsiteAlert(): Promise<string[]> {
  const messages: string[] = [];

  const notifications = await prisma.notification.findMany({
    where: {
      type: {
        in: [
          "GROUP_MEMBER_JOINED",
          "GROUP_MEMBER_LEFT",
          "GROUP_START_REMINDER",
        ],
      },
      read: false,
    },
  });

  for (const n of notifications) {
    messages.push(n.message);
  }

  return messages; // Always return an array
}





/**
 * Sends inbox + (optional) email reminders for groups starting soon.
 * Bucketed window (5 min) and also scans the **previous** bucket to avoid misses.
 * Emails are idempotent via EmailReminderLog unique([userId, groupId, window]).
 */
export async function sendGroupReminders(windowLabel: WindowLabel) {
  const now = new Date(); // UTC
  const tick = floorTo5Min(now); // e.g., 11:45, 11:50, 11:55, 12:00...

  // Current bucket (e.g., 12:00..12:05)
  const baseCurr = addMinutes(tick, WINDOW_TO_MINUTES[windowLabel]);
  const currFrom = baseCurr;
  const currTo = addMinutes(baseCurr, 5);

  // Previous bucket (e.g., 11:55..12:00) shifted by the same lookahead
  const basePrev = addMinutes(
    addMinutes(tick, -5),
    WINDOW_TO_MINUTES[windowLabel]
  );
  const prevFrom = basePrev;
  const prevTo = addMinutes(basePrev, 5);


  console.log(
    `[reminders] window=${windowLabel} now=${now.toISOString()} tick=${tick.toISOString()} ` +
      `curr=[${currFrom.toISOString()} .. ${currTo.toISOString()}) prev=[${prevFrom.toISOString()} .. ${prevTo.toISOString()})`
  );

  const groups = await prisma.group.findMany({
    where: {
      isClosed: false,
      end: { gt: now }, // only upcoming/ongoing
      OR: [
        { start: { gte: prevFrom, lt: prevTo } }, // previous 5-min bucket
        { start: { gte: currFrom, lt: currTo } }, // current 5-min bucket
      ],
    },
    include: {
      members: { include: { user: true } },
    },
  });

  console.log(`[reminders] groupsFound=${groups.length}`);

  let sentEmails = 0;

  for (const g of groups) {
    console.log(
      `[reminders] group id=${g.id} "${
        g.name
      }" start=${g.start.toISOString()} members=${g.members.length}`
    );

    const users = g.members.map((m) => m.user).filter(Boolean);

    // Inbox notifications (SQLite has no skipDuplicates; add your own guard if needed)
    if (users.length) {
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u!.id,
          groupId: g.id,
          type: "GROUP_START_REMINDER",
          message: `Reminder: "${
            g.name
          }" starts at ${g.start.toISOString()} (UTC) @ ${g.location}`,
          // expiresAt: g.end,
        })),
      });
    }

    // Email reminders (only for users with emailReminder = true) with de-dupe log
    const toEmail = users.filter((u) => u!.emailReminder);
    if (toEmail.length) {
      const existing = await prisma.emailReminderLog.findMany({
        where: {
          groupId: g.id,
          window: windowLabel,
          userId: { in: toEmail.map((u) => u!.id) },
        },
        select: { userId: true },
      });
      const already = new Set(existing.map((e) => e.userId));
      const fresh = toEmail.filter((u) => !already.has(u!.id));

      for (const u of fresh) {
        await sendEmail({
          to: u!.email,
          subject: `Reminder: ${g.name} starts soon`,
          html: `
            <p>Hi ${u!.username},</p>
            <p>Your study group <strong>${
              g.name
            }</strong> will start on <strong>${g.start.toISOString()}</strong> (UTC).</p>
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
