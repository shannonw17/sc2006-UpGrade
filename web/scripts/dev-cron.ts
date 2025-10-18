import "dotenv/config";
import cron from "node-cron";
import { sendGroupReminders } from "@/app/(backend)/ScheduleController/sendEmailReminder";

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

console.log("[cron] Dev scheduler running...");
console.log("[CRON] DB =", process.env.DATABASE_URL);
