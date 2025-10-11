// app/(frontend)/(protected)/layout.tsx
import { readSession, readAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userSession = await readSession();
  const adminSession = await readAdminSession();

  if (!userSession && !adminSession) {
    // neither logged in
    redirect("/login");
  }

  return <>{children}</>;
}
