// app/page.tsx
import { redirect } from "next/navigation";
import { readSession, readAdminSession } from "@/lib/auth";

export default async function RootPage() {
  const userSession = await readSession();
  const adminSession = await readAdminSession();

  if (adminSession) {
    // Admin logged in
    redirect("/admin");
  } else if (userSession) {
    // Normal user logged in
    redirect("/homepage");
  } else {
    // Not logged in
    redirect("/login");
  }
}