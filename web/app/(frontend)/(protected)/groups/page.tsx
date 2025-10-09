import prisma from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { joinGroup } from "@/app/(backend)/GroupController/joinGroup";
import { leaveGroup } from "@/app/(backend)/GroupController/leaveGroup";
import { requireUser } from "@/lib/requireUser";
import { normalizeFilters, type RawFilters } from "@/app/(backend)/FilterController/filterUtils";
import { fetchGroupsWithFilters } from "@/app/(backend)/FilterController/searchAndFilter";

import FilterBar from "./FilterBar";

export const runtime = "nodejs";

type PageProps = {
  searchParams?: Promise<RawFilters>;
};

export default async function GroupPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const CURRENT_USER_ID = user.id;

  const sp = await searchParams;
  const filters = normalizeFilters(sp);

  // keep the redirect rule to maintain a valid tab
  if (!sp?.tab || (sp.tab !== "all" && sp.tab !== "mine")) {
    redirect("/groups?tab=all");
  }

  const tab: "all" | "mine" = filters.tab;

  const {
    allGroups,
    myCreatedGroups,
    joinedGroups: justJoinedNotCreated,
    joinedSet,
  } = await fetchGroupsWithFilters(CURRENT_USER_ID, filters);

  return (
    <main className="flex flex-col items-center gap-y-5 pt-24 text-center">
      {/* Header */}
      <div className="flex w-full max-w-3xl items-center justify-between px-2">
        <h1 className="text-3xl font-semibold">Study Groups</h1>
        <Link href="/groups/create" className="ml-4 rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5">
          + Create Group
        </Link>
      </div>

      {/* Tabs */}
      <nav className="w-full max-w-3xl px-2">
        <div className="flex gap-3 border-b">
          <Tab href="/groups?tab=all"  active={tab === "all"}>All groups</Tab>
          <Tab href="/groups?tab=mine" active={tab === "mine"}>My groups</Tab>
        </div>
      </nav>

      {/* Filters */}
      <FilterBar />

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
                <li key={group.id} className="flex items-center justify-between px-5 py-2 gap-4">
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
                      <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">Host</span>
                    ) : !isJoined ? (
                      <form action={joinGroup}>
                        <input type="hidden" name="groupId" value={group.id} />
                        <input type="hidden" name="userId" value={CURRENT_USER_ID} />
                        <button
                          type="submit"
                          disabled={isFull}
                          className={`rounded-lg px-3 py-1.5 text-sm ${isFull ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-black text-white hover:bg-black/80"}`}
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

                    <Link href={`/groups/${group.id}`} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5">
                      View
                    </Link>
                  </div>
                </li>
              );
            })}

            {allGroups.length === 0 && (
              <li className="px-5 py-2 text-gray-500">No groups match your filters.</li>
            )}
          </ul>
        </section>
      ) : (
        <section className="w-full max-w-3xl space-y-8">
          {/* Created by me */}
          <div className="text-left px-2">
            <h2 className="mb-2 text-xl font-semibold">Created by me</h2>
            {myCreatedGroups.length === 0 ? (
              <Empty message="No groups match your filters." />
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
                      <Link href={`/groups/${g.id}`} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5">
                        View
                      </Link>
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
              <Empty message="No groups match your filters." />
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
                      <Link href={`/groups/${g.id}`} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5">
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
