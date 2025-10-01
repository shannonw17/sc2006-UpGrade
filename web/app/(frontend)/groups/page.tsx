import prisma from "@/lib/db";
import Link from "next/link";
import { joinGroup } from "@/app/(backend)/groupsController/joinGroup";
import { leaveGroup } from "@/app/(backend)/groupsController/leaveGroup"; 

export const runtime = "nodejs"; // Prisma needs Node

function getCurrentUserId() {
  // Use Test by default
  return "cmg86g3a60000vobc2o7b7776"; // replace with actual ID from Prisma Studio
}

export default async function GroupPage() {

    const CURRENT_USER_ID = getCurrentUserId();
   
    const [groups, myMemberships] = await Promise.all([
    prisma.group.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { members: true } },
      },
    }),
    prisma.groupMember.findMany({
      where: { userId: CURRENT_USER_ID },
      select: { groupId: true },
    }),
  ]);

  const joinedSet = new Set(myMemberships.map((m) => m.groupId));

    return (
    <main className="flex flex-col items-center gap-y-5 pt-24 text-center">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-semibold">All Groups ({groups.length})</h1>
        <Link
          href="/groups/create"
          className="ml-4 rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5"
        >
          + Create Group
        </Link>
      </div>

      <ul className="w-full max-w-3xl border-t border-b border-black/10 py-5 leading-8">
        {groups.map((group) => {
          const isJoined = joinedSet.has(group.id);
          const count = group._count.members; // server truth
          const isFull = count >= group.capacity;

          return (
            <li
              key={group.id}
              className="flex items-center justify-between px-5 py-2 gap-4"
            >
              <div className="text-left">
                <Link href={`/groups/${group.id}`}>
                  <h3 className="font-medium hover:underline">{group.name}</h3>
                </Link>
                <div className="text-sm text-gray-500">
                  {new Date(group.start).toLocaleString()} • {group.location}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {count}/{group.capacity}
                </span>

                {!isJoined && (
                  <form action={joinGroup}>
                    <input type="hidden" name="groupId" value={group.id} />
                    <button
                      type="submit"
                      disabled={isFull}
                      className={`rounded-lg px-3 py-1.5 text-sm ${
                        isFull
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-black text-white hover:bg-black/80"
                      }`}
                      title={isFull ? "Group is full" : "Join group"}
                    >
                      {isFull ? "Full" : "Join"}
                    </button>
                  </form>
                )}

                {isJoined && (
                  <form action={leaveGroup}>
                    <input type="hidden" name="groupId" value={group.id} />
                    <button
                      type="submit"
                      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5"
                      title="Leave group"
                    >
                      Leave
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}

        {groups.length === 0 && (
          <li className="px-5 py-2 text-gray-500">No groups available.</li>
        )}
      </ul>
    </main>
  );
}