// app/(frontend)/(protected)/layout.tsx
import { readSession, readAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Home, Users, Inbox, Calendar, MapPin, User, MessageSquare } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userSession = await readSession();
  const adminSession = await readAdminSession();

  if (!userSession && !adminSession) {
    redirect("/login");
  }

  const headersList = await headers();
  const currentPath = headersList.get("x-invoke-path") || "";

  async function logout() {
    "use server";
    const { clearSession } = await import("@/lib/auth");
    await clearSession();
  }

  // Safe display name - use type assertion or fallback
  const displayName = (userSession as any)?.name || 
                     (userSession as any)?.username || 
                     (adminSession as any)?.name || 
                     (adminSession as any)?.username || 
                     "User";

  // Sidebar link component
  function SidebarLink({
    href,
    icon: Icon,
    label,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
  }) {
    const isActive = currentPath === href;
    const baseClasses = "flex items-center gap-3 px-6 py-2 font-medium rounded-xl transition-all";
    const activeClasses = "bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-md";
    const inactiveClasses = "text-gray-700 hover:text-blue-600 hover:bg-gray-100";

    return (
      <Link
        href={href}
        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      >
        <Icon size={18} />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-300 px-6 py-4 bg-white shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="website logo" className="w-10 h-10" />
            <span className="text-xl font-bold text-gray-700">UpGrade</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Signed in as <b>{displayName}</b>
            </span>
            <form action={logout}>
              <button className="text-blue-600 text-sm font-medium">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Sidebar + Main Content */}
      <div className="flex">
        <aside className="w-64 border-r border-gray-300 min-h-screen bg-white p-4">
          <nav className="space-y-2">
            <SidebarLink href="/homepage" icon={Home} label="Home" />
            <SidebarLink href="/groups" icon={Users} label="Study groups" />
            <SidebarLink href="/chats" icon={MessageSquare} label="Chats" />
            <SidebarLink href="/inbox" icon={Inbox} label="Inbox" />
            <SidebarLink href="/schedule" icon={Calendar} label="Schedule" />
            <SidebarLink href="/Maps" icon={MapPin} label="Location Map" />
            <SidebarLink href="/myprofile" icon={User} label="Profile" />
          </nav>
        </aside>

        <section className="flex-1 p-6 bg-white">
          {children}
        </section>
      </div>
    </main>
  );
}