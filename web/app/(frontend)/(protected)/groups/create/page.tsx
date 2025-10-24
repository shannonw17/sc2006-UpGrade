"use client";
import { createGroup } from "@/app/(backend)/GroupController/createGroups";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CreateGroupPage() {
  const [location, setLocation] = useState("");
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState(4);

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnedLocation = searchParams.get("loc");

  useEffect(() => {
    const savedForm = sessionStorage.getItem("createGroupForm");
    if (savedForm) {
      const obj = JSON.parse(savedForm);
      setName(obj.name || "");
      setVisibility(obj.visibility || "public");
      setStartDate(obj.startDate || "");
      setStartTime(obj.startTime || "");
      setEndDate(obj.endDate || "");
      setEndTime(obj.endTime || "");
      setCapacity(Number(obj.capacity) || 4);
      setLocation(obj.location || "");
      sessionStorage.removeItem("createGroupForm");
    }

    const savedLocation = sessionStorage.getItem("selectedLocation");
    if (savedLocation) {
      setLocation(savedLocation);
      sessionStorage.removeItem("selectedLocation");
    }

    if (returnedLocation) setLocation(returnedLocation);
  }, [returnedLocation]);

  const goToMap = () => {
    const formState = {
      name,
      visibility,
      startDate,
      startTime,
      endDate,
      endTime,
      capacity: capacity.toString(),
      location,
    };
    sessionStorage.setItem("createGroupForm", JSON.stringify(formState));
    router.push("/Maps");
  };

  // Combine date and time for the form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Combine date and time into datetime strings
    const start = `${startDate}T${startTime}`;
    const end = `${endDate}T${endTime}`;
    
    const formData = new FormData(e.currentTarget);
    formData.set('start', start);
    formData.set('end', end);
    
    try {
      await createGroup(formData);
    } catch (error: any) {
      alert(`Failed to create group: ${error.message}`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a New Group</h1>
          <p className="text-gray-600">Set up your study group and start collaborating</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name
              </label>
              <input
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter group name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <select
                name="visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="public">Public - Anyone can join</option>
                <option value="private">Private - Invite only</option>
              </select>
            </div>

            {/* Start Date & Time */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Start Date & Time</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date</label>
                    <input
                      name="startDate"
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Time</label>
                    <input
                      name="startTime"
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* End Date & Time */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">End Date & Time</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date</label>
                    <input
                      name="endDate"
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Time</label>
                    <input
                      name="endTime"
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="flex space-x-3">
                <input
                  name="location"
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location or select on map"
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <button
                  type="button"
                  onClick={goToMap}
                  className="rounded-lg bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                >
                  Select on Map
                </button>
              </div>
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity
              </label>
              <div className="flex items-center space-x-3">
                <input
                  name="capacity"
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-32 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <span className="text-gray-500 text-sm">members</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <a 
                href="/groups" 
                className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </a>
              <button 
                type="submit" 
                className="rounded-lg bg-gradient-to-r from-black to-blue-700 px-6 py-3 text-white font-medium hover:opacity-90 transition-opacity shadow-sm"
              >
                Create Group
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Your group will be visible to others based on the visibility settings you choose.
          </p>
        </div>
      </div>
    </main>
  );
}