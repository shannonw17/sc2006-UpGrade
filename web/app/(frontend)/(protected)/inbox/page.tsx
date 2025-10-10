// app/(frontend)/(protected)/inbox/page.tsx
import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export default async function InboxPage() {
  const user = await requireUser();

  const [invitations, notifications] = await Promise.all([
    prisma.invitation.findMany({
      where: { receiverId: user.id },
      include: { group: true, sender: true },
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="max-w-3xl mx-auto mt-10">
      <h1 className="text-xl font-semibold mb-4">Inbox</h1>
      <section>
        <h2 className="font-medium text-lg mb-2">Invitations</h2>
        {invitations.map((i) => (
          <div key={i.id} className="border p-3 mb-2 rounded">
            Invite from <b>{i.sender.username}</b> to join{" "}
            <b>{i.group.name}</b>
          </div>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="font-medium text-lg mb-2">Notifications</h2>
        {notifications.map((n) => (
          <div key={n.id} className="border p-3 mb-2 rounded">
            {n.message}
          </div>
        ))}
      </section>
    </main>
  );
}
