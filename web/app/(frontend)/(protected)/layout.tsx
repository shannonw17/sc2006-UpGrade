// app/(frontend)/(protected)/layout.tsx
import { readSession, readAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import Sidebar from "./sidebar"; // Import the Sidebar component

// Function to check for unread notifications
async function getUnreadNotificationCount(userId: string) {
  try {
    const unreadCount = await prisma.notification.count({
      where: {
        userId: userId,
        read: false
      }
    });
    return unreadCount;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return 0;
  }
}

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

  // Get user ID safely
  const currentUserId = (userSession as any)?.userId || 
                       (userSession as any)?.id || 
                       (adminSession as any)?.userId || 
                       (adminSession as any)?.id;

  const unreadCount = currentUserId ? await getUnreadNotificationCount(currentUserId) : 0;

  async function logout() {
    "use server";
    const { clearSession } = await import("@/lib/auth");
    await clearSession();
  }

  // Safe display name
  const displayName = (userSession as any)?.name || 
                     (userSession as any)?.username || 
                     (adminSession as any)?.name || 
                     (adminSession as any)?.username || 
                     "User";

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
              <button className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Sidebar + Main Content */}
      <div className="flex">
        <Sidebar unreadCount={unreadCount} />

        <section className="flex-1 p-6 bg-white">
          {children}
        </section>
      </div>
    </main>
  );
}