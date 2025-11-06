// app/(frontend)/(protected)/groups/page.tsx
import prisma from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/requireUser";
import { normalizeFilters, type RawFilters } from "@/app/(backend)/FilterController/filterUtils";
import { fetchGroupsWithFilters } from "@/app/(backend)/FilterController/searchAndFilter";
import FilterBar from "./FilterBar";
import GroupsPageClient, { SearchBox } from "./GroupsPageClient";

export const runtime = "nodejs";

type PageProps = {
  searchParams?: Promise<RawFilters>;
};

export default async function GroupPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const CURRENT_USER_ID = user.id;

  const sp = await searchParams;
  
  // Handle tab parameter directly
  const rawTab = sp?.tab as string | undefined;
  
  let tab: "all" | "mine" | "joined" = "all";
  if (rawTab === "all" || rawTab === "mine" || rawTab === "joined") {
    tab = rawTab;
  } else {
    redirect("/groups?tab=all");
  }

  // Use normalizeFilters for other filters
  const filters = normalizeFilters(sp);
  
  // Don't add tab to filters - pass it separately
  // const finalFilters = { ...filters, tab }; // REMOVED

  // Pass user's education level to the filter function
  const {
    allGroups,
    myCreatedGroups,
    joinedGroups: justJoinedNotCreated,
    joinedSet,
  } = await fetchGroupsWithFilters(CURRENT_USER_ID, filters, user.eduLevel);

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
        _count: { select: { members: true } },
        tags: true
      }
    });
  }

  const hasActiveFilters = !!(filters.q || (filters as any).from || (filters as any).to || (filters as any).location || (filters as any).open);

  // Extract preserved filter parameters for SearchBox
  const preservedFilters = {
    from: (filters as any).from || sp?.from as string,
    to: (filters as any).to || sp?.to as string,
    loc: (filters as any).location || sp?.loc as string,
    open: (filters as any).open || sp?.open as string,
  };

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
          {/* Show FilterBar and SearchBox for ALL tabs */}
          <FilterBar />
          <SearchBox 
            tab={tab}
            initialQ={filters.q || ""}
            preserved={preservedFilters}
          />
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