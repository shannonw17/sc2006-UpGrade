import prisma from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/requireUser";
import { deleteGroup } from "@/app/(backend)/GroupController/deleteGroup";
import { DeleteButton } from "./DeleteButton";

interface GroupPageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: GroupPageProps) {
  const { id } = await params;

  const [group, user] = await Promise.all([
    prisma.group.findUnique({ where: { id } }),
    requireUser(), // current signed-in user
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

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/groups" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6"
          >
            ← Back to all groups
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <span className={`px-3 py-1 rounded-full ${
              group.visibility ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
            }`}>
              {group.visibility ? "Public" : "Private"}
            </span>
            <span>•</span>
            <span>{group.currentSize}/{group.capacity} members</span>
            {isHost && (
              <>
                <span>•</span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">You are hosting</span>
              </>
            )}
          </div>
        </div>

        {/* Group Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid gap-4">
            <DetailItem label="Group ID" value={group.groupID} />
            <DetailItem label="Start Time" value={new Date(group.start).toLocaleString()} />
            <DetailItem label="End Time" value={new Date(group.end).toLocaleString()} />
            <DetailItem label="Location" value={group.location} />
            <DetailItem label="Capacity" value={`${group.currentSize}/${group.capacity}`} />
            <DetailItem label="Host ID" value={group.hostId} />
            <DetailItem label="Created At" value={new Date(group.createdAt).toLocaleString()} />
          </div>

          {isHost && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <DeleteButton groupId={group.id} />
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