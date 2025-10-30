// web/app/(frontend)/(protected)/inbox/page.tsx
import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { acceptInvite } from "@/app/(backend)/InvitationController/acceptInvite";
import { rejectInvite } from "@/app/(backend)/InvitationController/rejectInvite";
import Link from "next/link";
import { MessageHostLink } from "./MessageHostLink";

type PageProps = {
  searchParams?: Promise<{ 
    accept?: string; 
    reject?: string; 
    msg?: string;
    tab?: 'invites' | 'notifications';
  }>;
};

// Server action to mark notification as read
async function markAsRead(formData: FormData) {
  "use server";
  const notificationId = formData.get("notificationId") as string;
  
  if (!notificationId) return;
  
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/inbox");
  } catch (error) {
    console.error("Mark as read failed:", error);
  }
}

// Server action to delete notification
async function deleteNotification(formData: FormData) {
  "use server";
  const notificationId = formData.get("notificationId") as string;
  
  if (!notificationId) return;
  
  try {
    await prisma.notification.delete({
      where: { id: notificationId },
    });
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/inbox");
  } catch (error) {
    console.error("Delete notification failed:", error);
  }
}

// Server action to mark all notifications as read
async function markAllAsRead() {
  "use server";
  const user = await requireUser();
  
  try {
    await prisma.notification.updateMany({
      where: { 
        userId: user.id,
        read: false
      },
      data: { read: true },
    });
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/inbox");
  } catch (error) {
    console.error("Mark all as read failed:", error);
  }
}

// Server action to delete all notifications
async function deleteAllNotifications() {
  "use server";
  const user = await requireUser();
  
  try {
    await prisma.notification.deleteMany({
      where: { userId: user.id },
    });
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/inbox");
  } catch (error) {
    console.error("Delete all notifications failed:", error);
  }
}

export default async function InboxPage(props: PageProps) {
  const sp = await props.searchParams;
  const user = await requireUser();
  const activeTab = sp?.tab || 'invites';

  async function onAccept(formData: FormData) {
    "use server";
    const res = await acceptInvite(formData);
    const { redirect } = require("next/navigation");
    
    if (res?.success) {
      const encodedMsg = encodeURIComponent(res.message);
      redirect(`/inbox?accept=ok&msg=${encodedMsg}&tab=${activeTab}`);
    } else {
      const encodedMsg = encodeURIComponent(res?.message || "Unable to accept invite.");
      redirect(`/inbox?accept=err&msg=${encodedMsg}&tab=${activeTab}`);
    }
  }

  async function onReject(formData: FormData) {
    "use server";
    const res = await rejectInvite(formData);
    const { redirect } = require("next/navigation");
    if (res?.success) {
      redirect(`/inbox?reject=ok&msg=${encodeURIComponent("Invitation rejected.")}&tab=${activeTab}`);
    } else {
      redirect(`/inbox?reject=err&msg=${encodeURIComponent("Unable to reject invite.")}&tab=${activeTab}`);
    }
  }

  const [invitations, notifications] = await Promise.all([
    prisma.invitation.findMany({
      where: { receiverId: user.id },
      include: {
        group: { 
          select: { 
            id: true, 
            name: true, 
            start: true, 
            end: true, 
            location: true, 
            capacity: true, 
            currentSize: true, 
            isClosed: true,
            hostId: true  // Added to get host ID for messaging
          } 
        },
        sender: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const flash =
    sp?.accept === "ok" || sp?.reject === "ok" ? (
      <div className="mb-6 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-100 rounded-lg">
            <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-emerald-800 text-sm">
              {sp?.msg ? decodeURIComponent(sp.msg) : "Action completed successfully"}
            </p>
          </div>
        </div>
      </div>
    ) : sp?.accept === "err" || sp?.reject === "err" ? (
      <div className="mb-6 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-rose-100 rounded-lg">
            <svg className="h-4 w-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-rose-800 text-sm">
              {sp?.msg ? decodeURIComponent(sp.msg) : "Something went wrong"}
            </p>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200/60 to-gray-300/40 py-8">
      <main className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                {unreadNotificationsCount > 0 && (
                  <div className="absolute -top-2 -right-2 px-2 py-1 bg-rose-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center shadow-lg">
                    {unreadNotificationsCount}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Inbox
                </h1>
                <p className="text-gray-500 mt-1">
                  {activeTab === 'invites' 
                    ? `${invitations.length} ${invitations.length === 1 ? 'invite' : 'invites'}`
                    : `${notifications.length} ${notifications.length === 1 ? 'notification' : 'notifications'} • ${unreadNotificationsCount} unread`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 shadow-sm">
                <span className="text-sm font-medium text-gray-700">
                  {new Date().toLocaleDateString('en-SG', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-gray-200/60 shadow-sm">
          <Link
            href="/inbox?tab=invites"
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex-1 text-center justify-center ${
              activeTab === 'invites'
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Invites
            {invitations.length > 0 && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                activeTab === 'invites'
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {invitations.length}
              </span>
            )}
          </Link>
          <Link
            href="/inbox?tab=notifications"
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex-1 text-center justify-center ${
              activeTab === 'notifications'
                ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notifications
            {unreadNotificationsCount > 0 && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                activeTab === 'notifications'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-600'
              }`}>
                {unreadNotificationsCount}
              </span>
            )}
          </Link>
        </div>

        {/* Messages Container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/60 shadow-xl overflow-hidden">
          {flash}

          {/* Invites Tab */}
          {activeTab === 'invites' && (
            <>
              {invitations.length === 0 ? (
                <div className="text-center py-16 px-8">
                  <div className="max-w-md mx-auto">
                    <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                      <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No pending invites</h3>
                    <p className="text-gray-500 mb-6">
                      When someone invites you to a study group, it will appear here.
                    </p>
                    <Link 
                      href="/groups"
                      className="inline-block px-6 py-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      Explore Groups
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100/80">
                  {invitations.map((invite, index) => {
                    const now = new Date();
                    const full = invite.group.currentSize >= invite.group.capacity;
                    const closed = invite.group.isClosed;
                    const expired = invite.group.end < now;
                    const started = invite.group.start < now;
                    
                    return (
                      <div
                        key={invite.id}
                        className={`group transition-all duration-200 hover:bg-gradient-to-r from-blue-50/80 to-indigo-50/50 ${
                          index === 0 ? 'rounded-t-3xl' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4 p-6">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow-sm">
                              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-bold text-gray-900">
                                  {invite.sender.username}
                                </span>
                                <span className="px-2.5 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium rounded-full shadow-sm">
                                  Invitation
                                </span>
                                {(full || closed || expired || started) && (
                                  <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                    {expired ? "Expired" : started ? "Started" : full ? "Full" : "Closed"}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-1 flex-shrink-0 ml-2">
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(invite.createdAt).toLocaleString("en-SG", {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </div>
                            </div>

                            <div className="text-gray-700 mb-4 leading-relaxed">
                              <span className="font-semibold text-gray-900">{invite.sender.username}</span> has invited you to join{' '}
                              <span className="font-bold bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {invite.group.name}
                              </span>
                            </div>

                            {/* Group Details */}
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="text-gray-600">
                                  📅 {new Date(invite.group.start).toLocaleDateString('en-SG', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </div>
                                <div className="text-gray-600">
                                  📍 {invite.group.location}
                                </div>
                                <div className="text-gray-600">
                                  👥 {invite.group.currentSize}/{invite.group.capacity} members
                                </div>
                                <div className={`${expired || started ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                                  {expired ? '⚠️ Expired' : started ? '⚠️ Started' : '✓ Available'}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <form action={onAccept}>
                                <input type="hidden" name="inviteId" value={invite.id} />
                                <button
                                  type="submit"
                                  disabled={full || closed || expired || started}
                                  className="px-5 py-2.5 bg-gradient-to-br from-emerald-500 to-green-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                  Accept Invite
                                </button>
                              </form>
                              <form action={onReject}>
                                <input type="hidden" name="inviteId" value={invite.id} />
                                <button
                                  type="submit"
                                  className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200 hover:scale-105"
                                >
                                  Decline
                                </button>
                              </form>
                              <Link 
                                href={`/groups/${invite.group.id}`}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition-colors group/link"
                              >
                                View details
                                <svg className="h-4 w-4 group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                              {/* NEW: Message Host Button - Requirement 1.1.1 */}
                              <MessageHostLink hostId={invite.group.hostId} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Notifications Tab - Keep existing code */}
          {activeTab === 'notifications' && (
            <>
              {notifications.length === 0 ? (
                <div className="text-center py-16 px-8">
                  <div className="max-w-md mx-auto">
                    <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications</h3>
                    <p className="text-gray-500 mb-6">
                      Your notifications will appear here when you have updates.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100/80">
                  {/* Action buttons */}
                  <div className="p-4 border-b border-gray-200 flex gap-2 flex-wrap">
                    {unreadNotificationsCount > 0 && (
                      <form action={markAllAsRead}>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors duration-200 font-medium"
                        >
                          Mark all as read
                        </button>
                      </form>
                    )}
                    {notifications.length > 0 && (
                      <form action={deleteAllNotifications}>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors duration-200 font-medium"
                        >
                          Clear all
                        </button>
                      </form>
                    )}
                  </div>
                  
                  {notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`group transition-all duration-200 ${
                        !notification.read 
                          ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/50 hover:from-blue-50 hover:to-indigo-50' 
                          : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-4 p-6">
                        {/* Avatar & Status */}
                        <div className="flex-shrink-0 relative">
                          <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-sm">
                            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          </div>
                          {!notification.read && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full border-2 border-white shadow-lg"></div>
                          )}
                        </div>

                        {/* Content - Clickable area to mark as read */}
                        <form action={markAsRead} className="flex-1 min-w-0 cursor-pointer">
                          <input type="hidden" name="notificationId" value={notification.id} />
                          <button type="submit" className="text-left w-full">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-gray-900">
                                  Study Groups
                                </span>
                                {!notification.read && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                    New
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-1 flex-shrink-0 ml-2">
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(notification.createdAt).toLocaleString("en-SG", {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </div>
                            </div>

                            <div className="text-gray-700 leading-relaxed">
                              {notification.message}
                            </div>
                          </button>
                        </form>

                        {/* Delete button */}
                        <form action={deleteNotification} className="flex-shrink-0">
                          <input type="hidden" name="notificationId" value={notification.id} />
                          <button
                            type="submit"
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                            title="Delete notification"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}