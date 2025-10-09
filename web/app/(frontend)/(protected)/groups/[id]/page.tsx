import prisma from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/requireUser";
import { deleteGroup } from "@/app/(backend)/GroupController/deleteGroup";

interface GroupPageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: GroupPageProps) {
  const { id } = await params;

  const [group, user] = await Promise.all([
    prisma.group.findUnique({ where: { id } }),
    requireUser(), // current signed-in user
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

  return (
    <main className="flex flex-col items-center gap-y-5 pt-24 text-center">
      <h1 className="text-3xl font-semibold">{group.name}</h1>

      <div className="border p-6 rounded-lg shadow max-w-xl text-left">
        <p><strong>Group ID:</strong> {group.groupID}</p>
        <p><strong>Visibility:</strong> {group.visibility ? "Public" : "Private"}</p>
        <p><strong>Start:</strong> {new Date(group.start).toLocaleString()}</p>
        <p><strong>End:</strong> {new Date(group.end).toLocaleString()}</p>
        <p><strong>Location:</strong> {group.location}</p>
        <p><strong>Capacity:</strong> {group.currentSize}/{group.capacity}</p>
        <p><strong>Host ID:</strong> {group.hostId}</p>
        <p><strong>Created At:</strong> {new Date(group.createdAt).toLocaleString()}</p>

        {isHost && (
          <form
            action={deleteGroup}
            className="mt-6 flex justify-end"
            // (optional) add a client confirm dialog via formAction if you want
          >
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
