// app/(frontend)/(protected)/groups/FilterBar.tsx
"use client";

<<<<<<< Updated upstream
import { useSearchParams, useRouter } from "next/navigation";
=======
import { useSearchParams } from "next/navigation";
>>>>>>> Stashed changes
import { useEffect, useState, useRef } from "react";

export default function FilterBar() {
  const sp = useSearchParams();
<<<<<<< Updated upstream
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loc, setLoc] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  // Sync with search params
=======
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [from, setFrom] = useState(sp.get("from") ?? "");
  const [to, setTo] = useState(sp.get("to") ?? "");
  const [location, setLocation] = useState(sp.get("location") ?? "");
  const [openOnly, setOpenOnly] = useState(sp.get("open") === "1");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Add event listener when dropdown is open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Clean up event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

>>>>>>> Stashed changes
  useEffect(() => {
    setFrom(sp.get("from") ?? "");
    setTo(sp.get("to") ?? "");
    setLocation(sp.get("location") ?? "");
    setOpenOnly(sp.get("open") === "1");
  }, [sp]);

<<<<<<< Updated upstream
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();

    // Preserve ALL existing parameters except the ones we're updating
    const currentTab = sp.get("tab") ?? "all";
    const currentQuery = sp.get("q") ?? "";
    
    params.set("tab", currentTab);
    if (currentQuery) params.set("q", currentQuery);
    
    // Add/update filter parameters
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (loc) params.set("loc", loc);
    if (openOnly) params.set("open", "1");

    console.log("Applying filters:", { from, to, loc, openOnly });
    console.log("URL params:", params.toString());

    router.push(`/groups?${params.toString()}`);
    setIsOpen(false);
  };

  const handleReset = () => {
    const params = new URLSearchParams();
    
    // Preserve only tab and search query, remove all filters
    const currentTab = sp.get("tab") ?? "all";
    const currentQuery = sp.get("q") ?? "";
    
    params.set("tab", currentTab);
    if (currentQuery) params.set("q", currentQuery);

    console.log("Resetting filters");
    
    router.push(`/groups?${params.toString()}`);
=======
  const handleApply = () => {
    setIsOpen(false);
    // The form will submit and refresh the page with filters
  };

  const handleReset = () => {
>>>>>>> Stashed changes
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Filter Button */}
      <button
<<<<<<< Updated upstream
        type="button"
=======
>>>>>>> Stashed changes
        onClick={() => setIsOpen(!isOpen)}
        className="border border-gray-300 px-4 py-2 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 bg-white"
      >
        Filter
      </button>

      {/* Dropdown Filter Panel */}
      {isOpen && (
        <div className="absolute top-12 left-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 z-10">
<<<<<<< Updated upstream
          <form onSubmit={handleApply} className="space-y-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">From</label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">To</label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                placeholder="Location contains…"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white"
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
              />
            </div>

            {/* Availability */}
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={openOnly}
                  onChange={(e) => setOpenOnly(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Only groups with space
              </label>
            </div>

            {/* Buttons */}
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
=======
          <form method="GET" className="space-y-4">
            {/* preserve active tab and search query */}
            <input type="hidden" name="tab" value={sp.get("tab") ?? "all"} />
            <input type="hidden" name="q" value={sp.get("q") ?? ""} />

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">From</label>
                  <input
                    type="datetime-local"
                    name="from"
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">To</label>
                  <input
                    type="datetime-local"
                    name="to"
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Location Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                name="location"
                placeholder="Enter location..."
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Availability Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="open"
                  value="1"
                  checked={openOnly}
                  onChange={(e) => setOpenOnly(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Only groups with space
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <a
                href={`/groups?tab=${sp.get("tab") ?? "all"}`}
>>>>>>> Stashed changes
                onClick={handleReset}
                className="flex-1 border border-gray-300 px-3 py-2 rounded text-sm hover:bg-gray-50 bg-white text-center"
              >
                Reset
<<<<<<< Updated upstream
              </button>
              <button
                type="submit"
=======
              </a>
              <button
                type="submit"
                onClick={handleApply}
>>>>>>> Stashed changes
                className="flex-1 bg-black text-white px-3 py-2 rounded text-sm hover:bg-gray-800"
              >
                Apply
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}