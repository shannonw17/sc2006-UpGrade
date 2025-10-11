"use server";

import { runExpireGroupsJob } from "@/lib/jobs/expireGroups";

export async function expireGroupsNow() {
  try {
    const res = await runExpireGroupsJob();
    return { ok: true, ...res };
  } catch (e) {
    console.error("expireGroupsNow error:", e);
    return { ok: false, error: "internal-error" };
  }
}
