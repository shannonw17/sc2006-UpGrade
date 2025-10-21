// app/actions/logout.ts
"use server";
import { clearSession, clearAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function logout() {
  await clearSession();
  await clearAdminSession();
  redirect("/login");
}
