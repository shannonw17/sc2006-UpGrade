// scripts/dev-cron.ts

import "dotenv/config";
import cron from "node-cron";
import { sendGroupReminders } from "@/app/(backend)/ScheduleController/sendEmailReminder";
import { expireGroupsNow } from "@/app/(backend)/GroupController/expireGroup";


// Email reminder 
function schedule(windowLabel: "24h"|"2h"|"15m", spec = "* * * * *") { // every minute
  console.log(`[cron] Scheduling ${windowLabel} (${spec}) UTC`);
  cron.schedule(
    spec,
    async () => {
      try {
        const res = await sendGroupReminders(windowLabel);
        console.log(`[cron] ${windowLabel} →`, res);
      } catch (e) {
        console.error(`[cron] ${windowLabel} error`, e);
      }
    },
    { timezone: "UTC" }
  );
}

schedule("24h");
schedule("2h");
schedule("15m");

// Expire groups that have reached their end time
cron.schedule("* * * * *", async () => {
  try {
    const r = await expireGroupsNow();
    if (r.closedCount > 0 || r.deletedCount > 0) {
      console.log(
        `[CRON] expireGroups → closed=${r.closedCount}, deleted=${r.deletedCount}, invitesDeleted=${r.invitationsDeleted}`
      );
      if (r.deletedIds.length) {
        console.log(`[CRON] deleted group IDs: ${r.deletedIds.join(", ")}`);
      }
    }
  } catch (e) {
    console.error("[CRON] expireGroups error", e);
  }
}, { timezone: "UTC" });


console.log("[cron] Dev scheduler running...");
console.log("[CRON] DB =", process.env.DATABASE_URL);
