// app/(frontend)/(protected)/groups/page.tsx
import prisma from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/requireUser";
import { normalizeFilters, type RawFilters } from "@/app/(backend)/FilterController/filterUtils";
import { fetchGroupsWithFilters } from "@/app/(backend)/FilterController/searchAndFilter";
import FilterBar from "./FilterBar";
import GroupCard from "./components/GroupCard";

export const runtime = "nodejs";

type PageProps = {
  searchParams?: Promise<RawFilters>;
};

export default async function GroupPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const CURRENT_USER_ID = user.id;

  const sp = await searchParams;
  
  // Handle tab parameter directly without normalizeFilters interference
  const rawTab = sp?.tab;
  const validTabs = ["all", "mine", "joined"] as const;
  type TabType = typeof validTabs[number];
  
  let tab: TabType = "all";
  if (rawTab && validTabs.includes(rawTab as TabType)) {
    tab = rawTab as TabType;
  } else {
    redirect("/groups?tab=all");
  }

  // Use normalizeFilters for other filters but preserve the tab
  const filters = normalizeFilters(sp);
  
  // Override the tab in filters with our directly handled tab
  const finalFilters = { ...filters, tab };

  const {
    allGroups,
    myCreatedGroups,
    joinedGroups: justJoinedNotCreated,
    joinedSet,
  } = await fetchGroupsWithFilters(CURRENT_USER_ID, finalFilters);

  // If joinedGroups is empty, fetch them manually
  let joinedGroups = justJoinedNotCreated;
  
  if (tab === 'joined' && joinedGroups.length === 0) {
    joinedGroups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: CURRENT_USER_ID
          }
        },
        hostId: { not: CURRENT_USER_ID }
      },
      include: {
        host: { select: { username: true } },
        members: { select: { userId: true } },
        _count: { select: { members: true } }
      }
    });
  }

  const hasActiveFilters = filters.q || filters.from || filters.to || filters.location || filters.open;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {tab === "all" ? "All groups" : tab === "mine" ? "Created groups" : "Joined groups"}
          </h1>
        </div>
        
        <div className="flex space-x-4">
          {tab === "all" && <FilterBar />}
          {tab === "all" && (
            <form method="GET" className="relative">
              <input type="hidden" name="tab" value="all" />
              <input
                type="text"
                name="q"
                placeholder="Search groups..."
                defaultValue={filters.q || ""}
                className="border border-gray-300 px-4 py-2 rounded text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900 bg-white"
              />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Tabs */}
      <nav className="mb-6">
        <div className="flex gap-8 border-b">
          <Tab href="/groups?tab=all" active={tab === "all"}>All groups</Tab>
          <Tab href="/groups?tab=mine" active={tab === "mine"}>Created groups</Tab>
          <Tab href="/groups?tab=joined" active={tab === "joined"}>Joined groups</Tab>
        </div>
      </nav>

      {/* Groups List */}
      <div className="space-y-4">
        {tab === "all" ? (
          <>
            {allGroups.map((group) => {
              const isJoined = joinedSet.has(group.id);
              const isHost = group.hostId === CURRENT_USER_ID;
              const count = group._count.members;
              const isFull = count >= group.capacity;

              return (
                <GroupCard
                  key={group.id}
                  group={group}
                  isHost={isHost}
                  isJoined={isJoined}
                  isFull={isFull}
                  count={count}
                  CURRENT_USER_ID={CURRENT_USER_ID}
                  showEdit={false}
                />
              );
            })}
            
            {allGroups.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200 p-8">
                <div className="text-gray-600 text-lg mb-2">
                  {hasActiveFilters ? 'No groups match your filters' : 'No groups found'}
                </div>
                <div className="text-gray-500 text-sm mb-4">
                  {hasActiveFilters ? 'Try adjusting your search and filters' : 'Be the first to create a group'}
                </div>
                
                {hasActiveFilters && (
                  <Link
                    href="/groups?tab=all"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear search & filters
                  </Link>
                )}
                
                {!hasActiveFilters && (
                  <Link 
                    href="/groups/create" 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Create your first group
                  </Link>
                )}
              </div>
            )}
          </>
        ) : tab === "mine" ? (
          <>
            {myCreatedGroups.length > 0 ? (
              <div className="space-y-4">
                {myCreatedGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isHost={true}
                    isJoined={true}
                    isFull={group._count.members >= group.capacity}
                    count={group._count.members}
                    CURRENT_USER_ID={CURRENT_USER_ID}
                    showEdit={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200 p-8">
                <div className="text-gray-600 text-lg mb-2">No created groups found</div>
                <Link 
                  href="/groups/create" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Create your first group
                </Link>
              </div>
            )}
          </>
        ) : (
          // Joined Groups Tab
          <>
            {joinedGroups.length > 0 ? (
              <div className="space-y-4">
                {joinedGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isHost={false}
                    isJoined={true}
                    isFull={group._count.members >= group.capacity}
                    count={group._count.members}
                    CURRENT_USER_ID={CURRENT_USER_ID}
                    showEdit={false}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200 p-8">
                <div className="flex flex-col items-center">
                  <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">You haven't joined any groups yet</h3>
                  <p className="text-gray-600 mb-6 text-center max-w-md">
                    Explore available study groups and join ones that match your interests and schedule.
                  </p>
                  <div className="flex gap-4">
                    <Link 
                      href="/groups?tab=all" 
                      className="bg-gradient-to-r from-black to-blue-700 text-white font-medium px-6 py-3 rounded-lg hover:opacity-90 transition text-sm"
                    >
                      Browse All Groups
                    </Link>
                    <Link 
                      href="/groups/create" 
                      className="border border-gray-300 text-gray-700 font-medium px-6 py-3 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      Create Your Own Group
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create Group Button - Only show in Created groups tab when there are groups */}
        {tab === "mine" && myCreatedGroups.length > 0 && (
          <div className="flex justify-center mt-8">
            <Link 
              href="/groups/create" 
              className="bg-gradient-to-r from-black to-blue-700 text-white font-medium px-6 py-3 rounded-full hover:opacity-90 transition text-sm flex items-center"
            >
              + Create new group
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Tab Component ---------- */

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
      className={`-mb-px px-1 py-2 text-sm font-medium ${
        active 
          ? "text-gray-900 border-b-2 border-gray-900" 
          : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {children}
    </Link>
  );
}