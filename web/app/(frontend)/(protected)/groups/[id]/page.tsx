// app/(frontend)/(protected)/groups/[id]/page.tsx
import prisma from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/requireUser";
import { deleteGroup } from "@/app/(backend)/GroupController/deleteGroup";
import { sendInvite } from "@/app/(backend)/InvitationController/inviteUser";

interface GroupPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ invite?: string; u?: string }>;
}

export default async function GroupDetailPage({ params, searchParams }: GroupPageProps) {
  const { id } = await params;
  const sp = await searchParams;

  const [group, user] = await Promise.all([
    prisma.group.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, username: true } },
        members: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
      },
    }),
    requireUser(),
  ]);

  if (!group) {
    return (
      <main className="flex flex-col items-center pt-24 text-center">
        <h1 className="text-2xl font-semibold">Group not found</h1>
        <Link href="/groups" className="text-blue-500 hover:underline mt-4">
          Back to all groups
        </Link>
      </main>
    );
  }

  const groupSafe = group!;
  const isHost = user.id === groupSafe.hostId;
  const isMember = isHost || groupSafe.members.some((m) => m.user.id === user.id);

  const otherMembers = groupSafe.members
    .map((m) => m.user)
    .filter((u) => u.id !== groupSafe.hostId)
    .sort((a, b) => a.username.localeCompare(b.username));

  const orderedMembers = [
    { id: groupSafe.host.id, username: groupSafe.host.username, isHost: true },
    ...otherMembers.map((u) => ({ id: u.id, username: u.username, isHost: false })),
  ];

// Server action wrapper
async function inviteAction(formData: FormData) {
  "use server";

  formData.set("groupId", groupSafe.id);

  const res = await sendInvite(formData); // returns InviteResult

  if (res.ok) {
    redirect(`/groups/${groupSafe.id}?invite=ok&u=${encodeURIComponent(res.invitedUsername)}`);
  } else {
    redirect(`/groups/${groupSafe.id}?invite=${res.error ?? "fail"}`);
  }
}

  const inviteStatus = sp?.invite;
  const invitedUser = sp?.u ? decodeURIComponent(sp.u) : "";

  return (
    <main className="flex flex-col items-center gap-y-5 pt-24 text-center">
      <h1 className="text-3xl font-semibold">{groupSafe.name}</h1>

      <div className="border p-6 rounded-lg shadow max-w-xl text-left w-full space-y-4">
        {inviteStatus === "ok" && (
          <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
            Invitation sent to <b>{invitedUser}</b>.
          </div>
        )}
        {inviteStatus === "fail" && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            Something went wrong. Please try again.
          </div>
        )}

        <p><strong>Group ID:</strong> {groupSafe.groupID}</p>
        <p><strong>Visibility:</strong> {groupSafe.visibility ? "Public" : "Private"}</p>
        <p><strong>Start:</strong> {new Date(groupSafe.start).toLocaleString()}</p>
        <p><strong>End:</strong> {new Date(groupSafe.end).toLocaleString()}</p>
        <p><strong>Location:</strong> {groupSafe.location}</p>
        <p><strong>Capacity:</strong> {groupSafe.currentSize}/{groupSafe.capacity}</p>
        <p><strong>Host Name:</strong> {groupSafe.host.username}</p>

        <div className="mt-2">
          <h2 className="text-lg font-semibold mb-3">Members</h2>
          {orderedMembers.length === 0 ? (
            <p className="text-gray-500">No members yet.</p>
          ) : (
            <ul className="space-y-2">
              {orderedMembers.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between border rounded px-3 py-2"
                >
                  <span className="font-medium">
                    {m.username}
                    {m.isHost && (
                      <span className="ml-2 text-xs text-white bg-amber-600 px-2 py-0.5 rounded">
                        Host
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {isMember && (
          <div className="mt-4 border-t pt-4">
            <h3 className="text-md font-semibold mb-2">Invite a user</h3>
            <p className="text-sm text-gray-600 mb-3">
              Enter the recipient&rsquo;s username to send an invitation.
            </p>
            <form action={inviteAction} className="flex gap-2 items-center">
              <input type="hidden" name="groupId" value={groupSafe.id} />
              <input
                type="text"
                name="receiverUsername"
                placeholder="username"
                className="border rounded px-3 py-2 w-full"
                required
              />
              <button
                type="submit"
                className="rounded bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700"
              >
                Send Invite
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              Invites create an inbox notification for the recipient.
            </p>
          </div>
        )}

        {isHost && (
          <form action={deleteGroup} className="mt-6 flex justify-end">
            <input type="hidden" name="groupId" value={groupSafe.id} />
            <button
              type="submit"
              className="rounded-lg bg-red-600 text-white px-4 py-2 hover:bg-red-700"
            >
              Delete Group
            </button>
          </form>
        )}
      </div>

      <Link href="/groups" className="text-blue-500 hover:underline">
        ← Back to all groups
      </Link>
    </main>
  );
}
