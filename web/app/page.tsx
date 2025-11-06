// app/page.tsx
import { redirect } from "next/navigation";
import { readSession, readAdminSession } from "@/lib/auth";

<<<<<<< Updated upstream
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
=======
export default async function HomePage() {
  const session = await readSession();
  
  if (session) {
    redirect("/homepage");
  } else {
>>>>>>> Stashed changes
    redirect("/login");
  }
}