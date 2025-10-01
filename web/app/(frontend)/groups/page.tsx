import prisma from "@/lib/db";
import Link from "next/link";

export default async function GroupPage() {
   
    const groups = await prisma.group.findMany({
        orderBy: { createdAt: 'desc' },
    });

    return (
    <main className="flex flex-col items-center gap-y-5 pt-24 text-center">
        <div>
      <h1 className="text-3xl font-semibold">
        All Groups ({groups.length})
      </h1>
      <Link href="/groups/create"
      className="ml-4 rounded-lg border px-3 py-1.5 text-sm hover:bg-black.5">
        + Create New Group
      </Link>
        </div>
      <ul className="w-full max-w-3xl border-t border-b border-black/10 py-5 leading-8">
        {groups.map((group) => (
          <li
            key={group.id}
            className="flex items-center justify-between px-5 py-2"
          >
            <Link href={`/groups/${group.id}`}>
              <h3 className="font-medium hover:underline">{group.name}</h3>
            </Link>
            <span className="text-sm text-gray-500">
              Capacity: {group.currentSize}/{group.capacity}
            </span>
          </li>
        ))}

        {groups.length === 0 && (
          <li className="px-5 py-2 text-gray-500">
            No groups available.
          </li>
        )}
      </ul>
    </main>
  );
}