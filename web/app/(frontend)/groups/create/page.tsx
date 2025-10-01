import { createGroup } from "@/app/(backend)/groupsController/createGroups";

export default function CreateGroupPage() {
  return (
    <main className="flex flex-col items-center gap-y-6 pt-24">
      <h1 className="text-3xl font-semibold">Create a New Group</h1>

      <form action={createGroup} className="w-full max-w-xl space-y-4 border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Group Name</label>
          <input
            name="name"
            type="text"
            required
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Visibility</label>
          <select name="visibility" className="w-full rounded border px-3 py-2">
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start</label>
            <input
              name="start"
              type="datetime-local"
              required
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End</label>
            <input
              name="end"
              type="datetime-local"
              required
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            name="location"
            type="text"
            required
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Capacity</label>
            <input
              name="capacity"
              type="number"
              min={1}
              defaultValue={4}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Host ID</label>
            <input
              name="hostId"
              type="text"
              required
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <a href="/groups" className="rounded-lg border px-4 py-2 text-sm hover:bg-black/5">
            Cancel
          </a>
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-black/80"
          >
            Create Group
          </button>
        </div>
      </form>
    </main>
  );
}
