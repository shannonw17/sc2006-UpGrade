// app/(frontend)/(protected)/inbox/page.tsx
import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { acceptInvite } from "@/app/(backend)/InvitationController/acceptInvite";
import { rejectInvite } from "@/app/(backend)/InvitationController/rejectInvite";

type PageProps = {
  searchParams?: Promise<{ accept?: string; reject?: string; msg?: string }>;
};

export default async function InboxPage(props: PageProps) {
  const sp = await props.searchParams;
  const user = await requireUser();

  // Inline server-action wrappers so we can redirect with a flash
  async function onAccept(formData: FormData) {
    "use server";
    const res = await acceptInvite(formData);
    const { redirect } = require("next/navigation");
    if (res?.success) {
      redirect(`/inbox?accept=ok&msg=${encodeURIComponent("Invitation accepted.")}`);
    } else {
      redirect(`/inbox?accept=err&msg=${encodeURIComponent("Unable to accept invite.")}`);
    }
  }

  async function onReject(formData: FormData) {
    "use server";
    const res = await rejectInvite(formData);
    const { redirect } = require("next/navigation");
    if (res?.success) {
      redirect(`/inbox?reject=ok&msg=${encodeURIComponent("Invitation rejected.")}`);
    } else {
      redirect(`/inbox?reject=err&msg=${encodeURIComponent("Unable to reject invite.")}`);
    }
  }

  const [invitations, notifications] = await Promise.all([
    prisma.invitation.findMany({
      where: { receiverId: user.id },
      include: {
        group: { select: { id: true, name: true, start: true, end: true, location: true, capacity: true, currentSize: true, isClosed: true } },
        sender: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const flash =
    sp?.accept === "ok" || sp?.reject === "ok" ? (
      <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
        {sp?.msg ? decodeURIComponent(sp.msg) : "Done."}
      </div>
    ) : sp?.accept === "err" || sp?.reject === "err" ? (
      <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
        {sp?.msg ? decodeURIComponent(sp.msg) : "Something went wrong."}
      </div>
    ) : null;

  return (
    <main className="max-w-3xl mx-auto mt-10 text-cyan-500">
      <h1 className="text-xl font-semibold mb-4">Inbox</h1>

      {flash}

      <section>
        <h2 className="font-medium text-lg mb-2">Invitations</h2>

        {invitations.length === 0 ? (
          <div className="text-sm text-gray-500">No pending invitations.</div>
        ) : (
          invitations.map((i) => {
            const full = i.group.currentSize >= i.group.capacity;
            const closed = i.group.isClosed;
            return (
              <div key={i.id} className="border p-4 mb-3 rounded text-cyan-600">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div>
                      Invite from <b>{i.sender.username}</b> to join <b>{i.group.name}</b>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(i.group.start).toLocaleString()} — {new Date(i.group.end).toLocaleString()} | {i.group.location}
                    </div>
                    {(full || closed) && (
                      <div className="mt-1 text-xs">
                        {full && <span className="mr-2 rounded bg-amber-100 px-2 py-0.5 text-amber-700">Group Full</span>}
                        {closed && <span className="rounded bg-rose-100 px-2 py-0.5 text-rose-700">Group Closed</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Accept */}
                    <form action={onAccept}>
                      <input type="hidden" name="inviteId" value={i.id} />
                      <button
                        type="submit"
                        className="rounded bg-emerald-600 text-white px-3 py-1.5 text-sm hover:bg-emerald-700 disabled:opacity-50"
                        disabled={full || closed}
                        title={full ? "Group is full" : closed ? "Group is closed" : "Accept invite"}
                      >
                        Accept
                      </button>
                    </form>

                    {/* Reject */}
                    <form action={onReject}>
                      <input type="hidden" name="inviteId" value={i.id} />
                      <button
                        type="submit"
                        className="rounded bg-red-600 text-white px-3 py-1.5 text-sm hover:bg-red-700"
                        title="Reject invite"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-medium text-lg mb-2">Notifications</h2>
        {notifications.length === 0 ? (
          <div className="text-sm text-gray-500">No notifications.</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="border p-3 mb-2 rounded text-cyan-600">
              {n.message}
            </div>
          ))
        )}
      </section>
    </main>
  );
}
