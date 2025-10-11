// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { readSession } from "@/lib/auth";
import { Home, Users, Inbox, Calendar, MapPin, User } from "lucide-react";
import { headers } from "next/headers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UpGrade",
  description: "Student Collaboration Platform",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();

  // Get current path from request headers
  const headersList = await headers();
  const currentPath = headersList.get("x-invoke-path") || headersList.get("x-pathname") || "";

  async function logout() {
    "use server";
    const { clearSession } = await import("@/lib/auth");
    await clearSession();
  }

  // Function to render sidebar links with active styling
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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-white`}>
        {session ? (
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
                    Signed in as <b>{session.name}</b>
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
        ) : (
          <main className="bg-white">{children}</main>
        )}
      </body>
    </html>
  );
}