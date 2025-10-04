// app/(frontend)/(protected)/groups/page.tsx
import prisma from "@/lib/db";
import Link from "next/link";
import { joinGroup } from "@/app/(backend)/GroupController/joinGroup";
import { leaveGroup } from "@/app/(backend)/GroupController/leaveGroup";
import { requireUser } from "@/lib/requireUser";

export const runtime = "nodejs";

type PageProps = {
  // 🔑 In newer Next versions, searchParams is a Promise
  searchParams?: Promise<{ tab?: string }>;
};

export default async function GroupPage({ searchParams }: PageProps) {
  // Force auth and get current user
  const user = await requireUser();
  const CURRENT_USER_ID = user.id;

  const sp = await searchParams;
  const tab: "all" | "mine" = sp?.tab === "mine" ? "mine" : "all"

  // Fetch common data in parallel
  const [allGroups, myMemberships, myCreatedGroups] = await Promise.all([
    prisma.group.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true } } },
    }),
    prisma.groupMember.findMany({
      where: { userId: CURRENT_USER_ID },
      select: { groupId: true },
    }),
    prisma.group.findMany({
      where: { hostId: CURRENT_USER_ID },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true } } },
    }),
  ]);

  const joinedSet = new Set(myMemberships.map((m) => m.groupId));

  // Pull the actual rows for groups the user has joined
  const joinedGroups = await prisma.group.findMany({
    where: { id: { in: Array.from(joinedSet) } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true } } },
  });

  // For UX, exclude groups you created from the "Joined by me" list
  const myCreatedIds = new Set(myCreatedGroups.map((g) => g.id));
  const justJoinedNotCreated = joinedGroups.filter((g) => !myCreatedIds.has(g.id));

  return (
    <main className="flex flex-col items-center gap-y-5 pt-24 text-center">
      {/* Header */}
      <div className="flex w-full max-w-3xl items-center justify-between px-2">
        <h1 className="text-3xl font-semibold">Study Groups</h1>
        <Link
          href="/groups/create"
          className="ml-4 rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5"
        >
          + Create Group
        </Link>
      </div>

      {/* Tabs */}
      <nav className="w-full max-w-3xl px-2">
        <div className="flex gap-3 border-b">
          <Tab href="/groups?tab=all" active={tab === "all"}>All groups</Tab>
          <Tab href="/groups?tab=mine" active={tab === "mine"}>My groups</Tab>
        </div>
      </nav>

      {/* Panels */}
      {tab === "all" ? (
        <section className="w-full max-w-3xl">
          <ul className="border-t border-b border-black/10 py-5 leading-8">
            {allGroups.map((group) => {
              const isJoined = joinedSet.has(group.id);
              const isHost   = group.hostId === CURRENT_USER_ID;
              const count = group._count.members;
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

                    {isHost ? (
                    <>
                      <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">Host</span>
                    </>

                    ) : !isJoined ? (
                      <form action={joinGroup}>
                        <input type="hidden" name="groupId" value={group.id} />
                        <input type="hidden" name="userId" value={CURRENT_USER_ID} />
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
                    ) : (
                      <form action={leaveGroup}>
                        <input type="hidden" name="groupId" value={group.id} />
                        <input type="hidden" name="userId" value={CURRENT_USER_ID} />
                        <button
                          type="submit"
                          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5"
                          title="Leave group"
                        >
                          Leave
                        </button>
                      </form>
                    )}
                  
                    <Link
                      href={`/groups/${group.id}`}
                      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5"
                    >
                      View
                    </Link>
                  </div>
                </li>
              );
            })}

            {allGroups.length === 0 && (
              <li className="px-5 py-2 text-gray-500">No groups available.</li>
            )}
          </ul>
        </section>
      ) : (
        <section className="w-full max-w-3xl space-y-8">
          {/* Created by me */}
          <div className="text-left px-2">
            <h2 className="mb-2 text-xl font-semibold">Created by me</h2>
            {myCreatedGroups.length === 0 ? (
              <Empty message="You haven’t created any groups yet." />
            ) : (
              <ul className="border-t border-b border-black/10 py-5 leading-8">
                {myCreatedGroups.map((g) => (
                  <li key={g.id} className="flex items-center justify-between px-5 py-2 gap-4">
                    <div>
                      <Link href={`/groups/${g.id}`}>
                        <h3 className="font-medium hover:underline">{g.name}</h3>
                      </Link>
                      <div className="text-sm text-gray-500">
                        {new Date(g.start).toLocaleString()} • {g.location}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {g._count.members}/{g.capacity}
                      </span>
                      <Link
                        href={`/groups/${g.id}`}
                        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5"
                      >
                        View
                      </Link>
                      {/* Hook up edit/close later if needed */}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Joined by me */}
          <div className="text-left px-2">
            <h2 className="mb-2 text-xl font-semibold">Joined by me</h2>
            {justJoinedNotCreated.length === 0 ? (
              <Empty message="You haven’t joined any groups yet." />
            ) : (
              <ul className="border-t border-b border-black/10 py-5 leading-8">
                {justJoinedNotCreated.map((g) => (
                  <li key={g.id} className="flex items-center justify-between px-5 py-2 gap-4">
                    <div>
                      <Link href={`/groups/${g.id}`}>
                        <h3 className="font-medium hover:underline">{g.name}</h3>
                      </Link>
                      <div className="text-sm text-gray-500">
                        {new Date(g.start).toLocaleString()} • {g.location}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {g._count.members}/{g.capacity}
                      </span>
                      <form action={leaveGroup}>
                        <input type="hidden" name="groupId" value={g.id} />
                        <input type="hidden" name="userId" value={CURRENT_USER_ID} />
                        <button
                          type="submit"
                          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5"
                          title="Leave group"
                        >
                          Leave
                        </button>
                      </form>
                      <Link
                        href={`/groups/${g.id}`}
                        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5"
                      >
                        View
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

/* ---------- small UI helpers ---------- */

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`-mb-px rounded-t px-4 py-2 text-sm ${
        active ? "border-b-2 border-black font-medium" : "text-gray-600 hover:text-black"
      }`}
    >
      {children}
    </Link>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <p className="rounded-lg border px-4 py-8 text-center text-sm text-gray-600">
      {message}
    </p>
  );
}
