// app/(frontend)/(protected)/groups/GroupsPageClient.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GroupCard from "./components/GroupCard";
import EditGroupModal from "./components/EditGroupModal";
import Link from "next/link";



interface GroupsPageClientProps {
  allGroups: any[];
  myCreatedGroups: any[];
  joinedGroups: any[];
  joinedSet: Set<any>;
  tab: string;
  CURRENT_USER_ID: string;
  hasActiveFilters: boolean;
}

export default function GroupsPageClient({
  allGroups,
  myCreatedGroups,
  joinedGroups,
  joinedSet,
  tab,
  CURRENT_USER_ID,
  hasActiveFilters
}: GroupsPageClientProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const searchParams = useSearchParams();

  // Check if we're returning from Maps with a group to edit
  useEffect(() => {
    const editGroupId = searchParams.get('edit');
    
    if (editGroupId) {
      // Find the group in myCreatedGroups
      const groupToEdit = myCreatedGroups.find(group => group.id === editGroupId);
      if (groupToEdit) {
        setEditingGroup(groupToEdit);
        setEditModalOpen(true);
        
        // Clean up the URL
        const newUrl = window.location.pathname + '?tab=mine';
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [searchParams, myCreatedGroups]);

  const handleEditClick = (group: any) => {
    console.log("Edit clicked for group:", group.id, group.name);
    setEditingGroup(group);
    setEditModalOpen(true);
  };

  const handleModalClose = () => {
    setEditModalOpen(false);
    setEditingGroup(null);
  };

  const handleGroupUpdate = () => {
    // Refresh the page to show updated data
    window.location.reload();
  };

  // Render empty states
  const renderEmptyState = () => {
    if (tab === "all" && allGroups.length === 0) {
      return (
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
      );
    }

    if (tab === "mine" && myCreatedGroups.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-gray-600 text-lg mb-2">No created groups found</div>
          <Link 
            href="/groups/create" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
            Create your first group
          </Link>
        </div>
      );
    }

    if (tab === "joined" && joinedGroups.length === 0)  {
      return (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex flex-col items-center">
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-xl font-semibold ...">
    {hasActiveFilters ? "No joined groups match your search" : "You haven't joined any groups yet"}
  </h3>
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
      );
    }

    return null;
  };

  return (
    <>
      {/* Groups List */}
      {tab === "all" ? (
        <>
          {allGroups.map((group) => {
            const isJoined = joinedSet.has(group.id);
            const isHost = group.hostId === CURRENT_USER_ID;
            const count = group._count.members;
            const isFull = count >= group.capacity;

            return (
              <div key={group.id} className="group hover:scale-[1.02] transition-all duration-300">
                <GroupCard
                  group={group}
                  isHost={isHost}
                  isJoined={isJoined}
                  isFull={isFull}
                  count={count}
                  CURRENT_USER_ID={CURRENT_USER_ID}
                  showEdit={false}
                />
              </div>
            );
          })}
        </>
      ) : tab === "mine" ? (
        <>
          {myCreatedGroups.map((group) => (
            <div key={group.id} className="group hover:scale-[1.02] transition-all duration-300">
              <GroupCard
                group={group}
                isHost={true}
                isJoined={true}
                isFull={group._count.members >= group.capacity}
                count={group._count.members}
                CURRENT_USER_ID={CURRENT_USER_ID}
                showEdit={true}
                onEditClick={handleEditClick}
              />
            </div>
          ))}
        </>
      ) : (
        // Joined Groups Tab
        <>
          {joinedGroups.map((group) => (
            <div key={group.id} className="group hover:scale-[1.02] transition-all duration-300">
              <GroupCard
                group={group}
                isHost={false}
                isJoined={true}
                isFull={group._count.members >= group.capacity}
                count={group._count.members}
                CURRENT_USER_ID={CURRENT_USER_ID}
                showEdit={false}
              />
            </div>
          ))}
        </>
      )}

      {/* Empty States */}
      {renderEmptyState()}

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

      {/* Edit Modal */}
      {editModalOpen && editingGroup && (
        <EditGroupModal
          group={editingGroup}
          onClose={handleModalClose}
          onUpdate={handleGroupUpdate}
        />
      )}
    </>
  );
}

/* ====== 🔎 Named export: Client SearchBox you can use in page.tsx ====== */
export function SearchBox({ tab, initialQ = "", preserved = {} }: {
  tab: "all" | "mine" | "joined";
  initialQ?: string;
  preserved?: { from?: string; to?: string; loc?: string; open?: string };
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const debRef = useRef<number | null>(null);

  const buildUrl = (withQ: string | null) => {
    const p = new URLSearchParams();
    p.set("tab", tab);
    if (withQ && withQ.trim()) p.set("q", withQ.trim());
    if (preserved.from) p.set("from", preserved.from);
    if (preserved.to)   p.set("to", preserved.to);
    if (preserved.loc)  p.set("loc", preserved.loc);
    if (preserved.open) p.set("open", preserved.open);
    return `/groups?${p.toString()}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQ(val);

    // instant clear -> clear query immediately
    if (val.trim() === "") {
      if (debRef.current) window.clearTimeout(debRef.current);
      router.replace(buildUrl(null)); // avoids stacking history on each key
      return;
    }

    // debounce: update URL (SSR refetch) ~250ms after last keystroke
    if (debRef.current) window.clearTimeout(debRef.current);
    debRef.current = window.setTimeout(() => {
      router.replace(buildUrl(val));
    }, 250) as unknown as number;
  };

  // prevent form submit navigation (we’re URL-driving onChange)
  const handleSubmit = (e: React.FormEvent) => e.preventDefault();

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input type="hidden" name="tab" value={tab} />
      <input
        type="text"
        name="q"
        placeholder="Search groups..."
        value={q}
        onChange={handleChange}
        className="border border-gray-300 px-4 py-2 rounded text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900 bg-white"
      />
      <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  );
}
