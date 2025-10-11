// app/layout.tsx  (SERVER component — do NOT add "use client")
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { readSession, readAdminSession } from "@/lib/auth";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UpGrade",
  description: "Study group coordination platform",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 🧠 Check both user and admin cookies
  const [session, adminSession] = await Promise.all([
  readSession(),
  readAdminSession(),
]);

  // Decide which name/role to show in header
  const isAdmin = Boolean(adminSession);
  const displayName = adminSession?.username || session?.name || "Guest";

  // Inline server action for logout
  async function logout() {
    "use server";
    const { clearSession, clearAdminSession } = await import("@/lib/auth");
    await clearSession();
    await clearAdminSession();
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {session || adminSession ? (
          <main className="min-h-screen bg-white">
            <header className="border-b border-gray-300 px-6 py-4 bg-white shadow-sm">
              <div className="flex justify-between items-center">
                {/* Logo */}
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="website logo" className="w-10 h-10" />
                  <span className="text-xl font-bold text-gray-700">UpGrade</span>
                </div>

                {/* Header right: name + logout */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Signed in as <b>{displayName}</b>
                    {isAdmin && <span className="ml-1 text-red-500">(Admin)</span>}
                  </span>
                  <form action={logout}>
                    <button className="text-blue-600 text-sm font-medium">Logout</button>
                  </form>
                </div>
              </div>
            </header>

            <div className="flex">
              {/* Sidebar */}
              <aside className="w-64 border-r border-gray-300 min-h-screen bg-gray-50">
                <nav>
                  <ul className="space-y-4">
                    <li>
                      <Link href="/homepage" className="text-gray-700 hover:text-blue-600 block px-6 py-1 font-medium">
                        Home
                      </Link>
                    </li>
                    <li>
                      <Link href="/groups" className="text-gray-700 hover:text-blue-600 block px-6 py-1 font-medium">
                        Study Groups
                      </Link>
                    </li>
                    <li>
                      <Link href="/inbox" className="text-gray-700 hover:text-blue-600 block px-6 py-1 font-medium">
                        Inbox
                      </Link>
                    </li>
                    <li>
                      <Link href="/schedule" className="text-gray-700 hover:text-blue-600 block px-6 py-1 font-medium">
                        Schedule
                      </Link>
                    </li>
                    <li>
                      <Link href="/Maps" className="text-gray-700 hover:text-blue-600 block px-6 py-1 font-medium">
                        Location Map
                      </Link>
                    </li>
                    <li>
                      <Link href="/myprofile" className="text-gray-700 hover:text-blue-600 block px-6 py-1 font-medium">
                        Profile
                      </Link>
                    </li>
                    <li>
                      <Link href="/about" className="text-gray-700 hover:text-blue-600 block px-6 py-1 font-medium">
                        About
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="text-gray-700 hover:text-blue-600 block px-6 py-1 font-medium">
                        Contact
                      </Link>
                    </li>
                    <li>
                      <Link href="/users" className="text-gray-700 hover:text-blue-600 block px-6 py-1 font-medium">
                        Users
                      </Link>
                    </li>

                    {/* ✅ Admin-only link */}
                    {isAdmin && (
                      <li>
                        <Link href="/admin/reports" className="text-red-600 hover:text-red-700 block px-6 py-1 font-medium">
                          Reports
                        </Link>
                      </li>
                    )}
                  </ul>
                </nav>
              </aside>

              {/* Main content */}
              <section className="flex-1 p-6">{children}</section>
            </div>
          </main>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}
