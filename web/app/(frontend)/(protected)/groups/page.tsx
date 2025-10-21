// app/(frontend)/(protected)/groups/page.tsx
import prisma from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/requireUser";
import { normalizeFilters, type RawFilters } from "@/app/(backend)/FilterController/filterUtils";
import { fetchGroupsWithFilters } from "@/app/(backend)/FilterController/searchAndFilter";
import FilterBar from "./FilterBar";
import GroupCard from "./components/GroupCard"; // Import the new component

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

  // Check if any filters are active - use the filters object
  const hasActiveFilters = filters.q || filters.from || filters.to || filters.location || filters.open;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {tab === "all" ? "All groups" : "Created groups"}
          </h1>
        </div>
        
        <div className="flex space-x-4">
          {/* FilterBar will handle the filter button and dropdown */}
          {tab === "all" && <FilterBar />}

          {/* Search Bar - Only show in All Groups tab */}
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
        </div>
      </nav>

      {/* Groups List - Rectangular Layout */}
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
                  showEdit={false} // No edit button in All Groups tab
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
                
                {/* Clear Search & Filters Button - Only show when filters are active */}
                {hasActiveFilters && (
                  <Link
                    href="/groups?tab=all"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear search & filters
                  </Link>
                )}
                
                {/* Create Group Link - Only show when no filters and no groups */}
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
        ) : (
          <>
            {/* Created Groups Section */}
            {myCreatedGroups.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Groups You Created</h2>
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
                      showEdit={true} // Show edit button for created groups
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Joined Groups Section */}
            {justJoinedNotCreated.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Groups You've Joined</h2>
                <div className="space-y-4">
                  {justJoinedNotCreated.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isHost={false}
                      isJoined={true}
                      isFull={group._count.members >= group.capacity}
                      count={group._count.members}
                      CURRENT_USER_ID={CURRENT_USER_ID}
                      showEdit={false} // No edit button for joined groups
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Create Group Button at Bottom */}
            <div className="flex justify-center mt-8">
              <Link 
                href="/groups/create" 
                className="bg-gradient-to-r from-black to-blue-700 text-white font-medium px-6 py-3 rounded-full hover:opacity-90 transition text-sm flex items-center"
              >
                + Create new group
              </Link>
            </div>

            {myCreatedGroups.length === 0 && justJoinedNotCreated.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200 p-8">
                <div className="text-gray-600 text-lg mb-2">No groups found</div>
                <Link 
                  href="/groups/create" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Create your first group
                </Link>
              </div>
            )}
          </>
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