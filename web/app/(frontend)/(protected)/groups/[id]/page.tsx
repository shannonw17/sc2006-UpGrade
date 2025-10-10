import prisma from "@/lib/db";
import Link from "next/link";
import { requireUser } from "@/lib/requireUser";
import { deleteGroup } from "@/app/(backend)/GroupController/deleteGroup";

interface GroupPageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: GroupPageProps) {
  const { id } = await params;

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

  const isHost = user.id === group.hostId;

  // Build a clean member list with host first, others alphabetically
  const otherMembers = group.members
    .map((m) => m.user)
    .filter((u) => u.id !== group.hostId)
    .sort((a, b) => a.username.localeCompare(b.username));

  const orderedMembers = [
    { id: group.host.id, username: group.host.username, isHost: true },
    ...otherMembers.map((u) => ({ id: u.id, username: u.username, isHost: false })),
  ];

  return (
    <main className="flex flex-col items-center gap-y-5 pt-24 text-center">
      <h1 className="text-3xl font-semibold">{group.name}</h1>

      <div className="border p-6 rounded-lg shadow max-w-xl text-left w-full">
        <p><strong>Group ID:</strong> {group.groupID}</p>
        <p><strong>Visibility:</strong> {group.visibility ? "Public" : "Private"}</p>
        <p><strong>Start:</strong> {new Date(group.start).toLocaleString()}</p>
        <p><strong>End:</strong> {new Date(group.end).toLocaleString()}</p>
        <p><strong>Location:</strong> {group.location}</p>
        <p><strong>Capacity:</strong> {group.currentSize}/{group.capacity}</p>
        <p><strong>Host Name:</strong> {group.host.username}</p>
        <p><strong>Created At:</strong> {new Date(group.createdAt).toLocaleString()}</p>

        {/* Members list */}
        <div className="mt-6">
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
                    {m.username} {m.isHost && <span className="ml-2 text-xs text-white bg-amber-600 px-2 py-0.5 rounded">Host</span>}
                  </span>
                  {/* You can add per-member actions here (e.g., remove/kick) for host only */}
                </li>
              ))}
            </ul>
          )}
        </div>

        {isHost && (
          <form action={deleteGroup} className="mt-6 flex justify-end">
            <input type="hidden" name="groupId" value={group.id} />
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
