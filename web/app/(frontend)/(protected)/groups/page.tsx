// app/(frontend)/(protected)/groups/page.tsx
import prisma from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/requireUser";
import { normalizeFilters, type RawFilters } from "@/app/(backend)/FilterController/filterUtils";
import { fetchGroupsWithFilters } from "@/app/(backend)/FilterController/searchAndFilter";
import FilterBar from "./FilterBar";
import GroupsPageClient from "./GroupsPageClient";

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

  // Pass user's education level to the filter function
  const {
    allGroups,
    myCreatedGroups,
    joinedGroups: justJoinedNotCreated,
    joinedSet,
  } = await fetchGroupsWithFilters(CURRENT_USER_ID, finalFilters, user.eduLevel);

  // If joinedGroups is empty, fetch them manually with education level filter
  let joinedGroups = justJoinedNotCreated;
  
  if (tab === 'joined' && joinedGroups.length === 0) {
    joinedGroups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: CURRENT_USER_ID
          }
        },
        hostId: { not: CURRENT_USER_ID },
        // Add education level filter for joined groups too
        host: {
          eduLevel: user.eduLevel
        }
      },
      include: {
        host: { 
          select: { 
            username: true,
            eduLevel: true 
          } 
        },
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
      <GroupsPageClient
        allGroups={allGroups}
        myCreatedGroups={myCreatedGroups}
        joinedGroups={joinedGroups}
        joinedSet={joinedSet}
        tab={tab}
        CURRENT_USER_ID={CURRENT_USER_ID}
        hasActiveFilters={hasActiveFilters}
      />
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