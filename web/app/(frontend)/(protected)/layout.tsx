// app/(frontend)/(protected)/layout.tsx
import { readSession, readAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import Sidebar from "./sidebar";

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

// Function to get unread message count - only counts OTHER people's messages
async function getUnreadMessageCount(userId: string) {
  try {
    // Count unread messages where:
    // 1. The user is in the chat (user1 or user2)
    // 2. The message was NOT sent by the user
    // 3. The message is unread (read = false)
    const unreadCount = await prisma.message.count({
      where: {
        chat: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        },
        senderId: {
          not: userId  // Exclude messages sent by the current user
        },
        read: false  // Only unread messages
      }
    });
    
    return unreadCount;
  } catch (error) {
    console.error('Error fetching unread messages:', error);
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

  // Check if user is admin
  const isAdmin = !!adminSession;

  // Get user ID safely
  const currentUserId = (userSession as any)?.userId || 
                       (userSession as any)?.id || 
                       (adminSession as any)?.userId || 
                       (adminSession as any)?.id;

  const unreadCount = currentUserId ? await getUnreadNotificationCount(currentUserId) : 0;
  const unreadMessageCount = currentUserId ? await getUnreadMessageCount(currentUserId) : 0;

  async function logout() {
    "use server";
    const { clearSession, clearAdminSession } = await import("@/lib/auth");
    await clearSession();
    await clearAdminSession();
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
              {isAdmin && <span className="ml-2 text-red-600">(Admin)</span>}
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
        <Sidebar 
          unreadCount={unreadCount} 
          unreadMessageCount={unreadMessageCount}
          isAdmin={isAdmin}
        />

        <section className="flex-1 p-6 bg-white">
          {children}
        </section>
      </div>
    </main>
  );
}