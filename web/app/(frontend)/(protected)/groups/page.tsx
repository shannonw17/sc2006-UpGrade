// app/(frontend)/(protected)/groups/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/requireUser";
import { normalizeFilters, type RawFilters } from "@/app/(backend)/FilterController/filterUtils";
import { fetchGroupsWithFilters } from "@/app/(backend)/FilterController/filterGroups";
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

  // Fetch data
  const {
    allGroups,
    myCreatedGroups,
    joinedGroups: justJoinedNotNotCreated,
    joinedSet,
  } = await fetchGroupsWithFilters(CURRENT_USER_ID, filters, {
    userEduLevel: user.eduLevel, // ✅ keep same edu level
  });

  const joinedGroups = justJoinedNotNotCreated;

  // Use normalized fields for this
  const hasActiveFilters =
    !!(filters.q || filters.loc || filters.fromISO || filters.toISO || filters.openOnly);

  // ✅ Helper to preserve search + filters across tabs
  function tabHref(next: "all" | "mine" | "joined") {
    const p = new URLSearchParams();
    p.set("tab", next);

    if ((sp as any)?.q)    p.set("q", String((sp as any).q));
    if ((sp as any)?.from) p.set("from", String((sp as any).from));
    if ((sp as any)?.to)   p.set("to", String((sp as any).to));
    if ((sp as any)?.loc)  p.set("loc", String((sp as any).loc));
    if ((sp as any)?.open) p.set("open", String((sp as any).open)); // "1"

    return `/groups?${p.toString()}`;
  }

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
          {/* Client FilterBar */}
          <FilterBar />

          {/* ✅ Client SearchBox (no server-side form) */}
          <SearchBox
            tab={tab}
            initialQ={filters.q || ""}
            preserved={{
              from: (sp as any)?.from,
              to:   (sp as any)?.to,
              loc:  (sp as any)?.loc,
              open: (sp as any)?.open, // "1"
            }}
          />
        </div>
      </div>

      {/* ✅ Tabs with preserved filters */}
      <nav className="mb-6">
        <div className="flex gap-8 border-b">
          <Tab href={tabHref("all")} active={tab === "all"}>All groups</Tab>
          <Tab href={tabHref("mine")} active={tab === "mine"}>Created groups</Tab>
          <Tab href={tabHref("joined")} active={tab === "joined"}>Joined groups</Tab>
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
        active ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {children}
    </Link>
  );
}
