// app/page.tsx
import { readSession, readAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  // Read both user + admin cookies
  const userSession = await readSession();
  const adminSession = await readAdminSession();

  // If neither logged in → redirect to login
  if (!userSession && !adminSession) {
    redirect("/login");
  }

  // Decide what to show
  const isAdmin = Boolean(adminSession);
  const displayName = adminSession?.username || userSession?.name || "Guest";

  // Inline server action for logout
  async function logout() {
    "use server";
    const { clearSession, clearAdminSession } = await import("@/lib/auth");
    await clearSession();
    await clearAdminSession();
  }

  return (
    <main className="p-10 space-y-6">
      <h1 className="text-2xl font-semibold">
        Welcome, {displayName} {isAdmin && <span className="text-red-500">(Admin)</span>}
      </h1>

      <p className="text-gray-600">
        You are logged in as a {isAdmin ? "system administrator" : "regular user"}.
      </p>

      <form action={logout}>
        <button className="border px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
          Log out
        </button>
      </form>
    </main>
  );
}
