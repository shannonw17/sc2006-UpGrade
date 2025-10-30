// app/(frontend)/(protected)/groups/[id]/page.tsx
import prisma from "@/lib/db";
import Link from "next/link";
import { requireUser } from "@/lib/requireUser";
import { DeleteButton } from "./DeleteButton";
import { ArrowLeft } from "lucide-react";
import { MessageHostButton } from "./MessageHostButton";
import { MessageMemberButton } from "./MessageMemberButton";

interface GroupPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fromTab?: string }>;
}

export default async function GroupDetailPage({ params, searchParams }: GroupPageProps) {
  const { id } = await params;
  const { fromTab } = await searchParams;

  const [group, user] = await Promise.all([
    prisma.group.findUnique({
      where: { id },
      include: { 
        host: { select: { username: true, id: true } },
        members: {
          include: {
            user: {
              select: {
                username: true,
                id: true
              }
            }
          }
        }
      },
    }),
    requireUser(),
  ]);

  if (!group) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Group not found</h1>
          <Link href="/groups" className="text-blue-600 hover:text-blue-800 font-medium">
            Back to all groups
          </Link>
        </div>
      </main>
    );
  }

  const isHost = user.id === group.hostId;
  const isMember = group.members.some((member: any) => member.userId === user.id);
  
  // Determine which tab to go back to
  const getBackTabInfo = () => {
    // Always respect the fromTab parameter first
    if (fromTab === 'mine') {
      return { tab: 'mine', label: 'Created Groups' };
    } else if (fromTab === 'joined') {
      return { tab: 'joined', label: 'Joined Groups' };
    } else {
      // Default to all groups if no fromTab specified
      return { tab: 'all', label: 'All Groups' };
    }
  };

  const { tab: backTab, label: backLabel } = getBackTabInfo();
  const backHref = `/groups?tab=${backTab}`;
  
  // Get all members including the host
  const allMembers = [
    { username: group.host?.username || "Unknown", isHost: true, id: group.hostId },
    ...group.members
      .filter(member => member.userId !== group.hostId) // Exclude host from members list since they're already included
      .map(member => ({
        username: member.user.username,
        isHost: false,
        id: member.userId
      }))
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Smart Back Button */}
        <div className="mb-6">
          <Link 
            href={backHref}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to {backLabel}
          </Link>
        </div>

        {/* Group Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <span
              className={`px-3 py-1 rounded-full ${
                group.visibility ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
              }`}
            >
              {group.visibility ? "Public" : "Private"}
            </span>
            <span>•</span>
            <span>
              {group.currentSize}/{group.capacity} members
            </span>
            {isHost && (
              <>
                <span>•</span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                  You are hosting
                </span>
              </>
            )}
            {!isHost && isMember && (
              <>
                <span>•</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  You have joined
                </span>
              </>
            )}
          </div>
        </div>

        {/* NEW: Message Host Button - Requirement 1.1.2 (for non-hosts viewing public groups) */}
        {!isHost && group.visibility && (
          <div className="mb-6 flex justify-center">
            <MessageHostButton hostId={group.hostId} />
          </div>
        )}

        {/* Group Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid gap-4">
            <DetailItem label="Group Name" value={group.groupID} />
            <DetailItem label="Start Time" value={new Date(group.start).toLocaleString()} />
            <DetailItem label="End Time" value={new Date(group.end).toLocaleString()} />
            <DetailItem label="Location" value={group.location} />
            <DetailItem label="Capacity" value={`${group.currentSize}/${group.capacity}`} />
            <DetailItem label="Host" value={group.host?.username || "Unknown"} />
            <DetailItem label="Created At" value={new Date(group.createdAt).toLocaleString()} />
          </div>

          {isHost && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <DeleteButton groupId={group.id} />
            </div>
          )}
        </div>

        {/* Members List Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Group Members ({allMembers.length})</h2>
          
          {allMembers.length > 0 ? (
            <div className="space-y-3">
              {allMembers.map((member, index) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white text-sm font-semibold">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">
                        {member.username}
                        {member.isHost && (
                          <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                            Host
                          </span>
                        )}
                      </span>
                      {member.id === user.id && (
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {member.isHost && !isHost && (
                      <span className="text-sm text-gray-500 font-medium">Creator</span>
                    )}
                    
                    {/* NEW: Message Member Button - Requirement 1.2.1 (for hosts) */}
                    {isHost && !member.isHost && member.id !== user.id && (
                      <MessageMemberButton memberId={member.id} memberName={member.username} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>No members in this group yet</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-sm font-medium text-gray-500 mb-1 sm:mb-0">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}