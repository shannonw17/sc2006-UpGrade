// app/page.tsx
import { requireUser } from "@/lib/requireUser";
import { logout } from "@/app/(backend)/AccountController/logout";

export default async function Home() {
  const user = await requireUser();

  return (
    <main className="p-10 space-y-6">
      <h1 className="text-2xl">Welcome, {user.name}</h1>
      <form action={logout}>
        <button className="border px-3 py-2 rounded">Log out</button>
      </form>
    </main>
  );
}
