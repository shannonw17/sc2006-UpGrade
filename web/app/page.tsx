// app/page.tsx
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth";

export default async function RootPage() {
  const session = await readSession();
  if (!session) {
    // not logged in → send to /login
    redirect("/login");
  } else {
    // logged in → send to your protected homepage
    redirect("/testHomepage");
  }
}
