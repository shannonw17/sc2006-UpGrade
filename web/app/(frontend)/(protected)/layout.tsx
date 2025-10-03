// app/(frontend)/(protected)/layout.tsx
import { requireUser } from "@/lib/requireUser";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireUser(); // redirects to /login if not logged in
  return <>{children}</>;
}
