"use client";
import { createGroup } from "@/app/(backend)/GroupController/createGroups";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function CreateGroupPage() {
  const [location, setLocation] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnedLocation = searchParams.get("loc");


const [name, setName] = useState("");
const [visibility, setVisibility] = useState("public");
const [start, setStart] = useState("");
const [end, setEnd] = useState("");
const [capacity, setCapacity] = useState(4);
const [hostId, setHostId] = useState("");




  useEffect(() => {
    const savedForm = sessionStorage.getItem("createGroupForm");
    if (savedForm) {
      const obj = JSON.parse(savedForm);
      setName(obj.name || "");
      setVisibility(obj.visibility || "public");
      setStart(obj.start || "");
      setEnd(obj.end || "");
      setCapacity(Number(obj.capacity) || 4);
      setHostId(obj.hostId || "");
      setLocation(obj.location || "");
      sessionStorage.removeItem("createGroupForm");
    }

    const savedLocation = sessionStorage.getItem("selectedLocation");
    if (savedLocation) {
      setLocation(savedLocation);
      sessionStorage.removeItem("selectedLocation");
    }
  }, []);


  const goToMap = () => {
    const formState = {
      name,
      visibility,
      start,
      end,
      capacity: capacity.toString(),
      hostId,
      location,
    };
    sessionStorage.setItem("createGroupForm", JSON.stringify(formState));
    router.push("/Maps");
  };
  
  
  
  
  return (
    <main className="flex flex-col items-center gap-y-6 pt-24">
      <h1 className="text-3xl font-semibold">Create a New Group</h1>

      <form
        action={createGroup}
        className="w-full max-w-xl space-y-4 border rounded-lg p-6"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Group Name</label>
          <input
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Visibility</label>
          <select
            name="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full rounded border px-3 py-2"
          >
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
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End</label>
            <input
              name="end"
              type="datetime-local"
              required
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <div className="flex mb-2">
            <input
              name="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 rounded-l border border-r-0 px-3 py-2"
            />
            <button
              type="button"
              onClick={goToMap}
              className="rounded-r bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
            >
              Select on Map
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Capacity</label>
            <input
              name="capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Host ID</label>
            <input
              name="hostId"
              type="text"
              required
              value={hostId}
              onChange={(e) => setHostId(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <a
            href="/groups"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-black/5"
          >
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
