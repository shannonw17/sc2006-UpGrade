"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function FilterBar() {
  const sp = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loc, setLoc] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  // Sync with search params
  useEffect(() => {
    setFrom(sp.get("from") ?? "");
    setTo(sp.get("to") ?? "");
    setLoc(sp.get("loc") ?? "");
    setOpenOnly(sp.get("open") === "1");
  }, [sp]);

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
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Filter Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="border border-gray-300 px-4 py-2 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 bg-white"
      >
        Filter
      </button>

      {/* Dropdown Filter Panel */}
      {isOpen && (
        <div className="absolute top-12 left-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 z-10">
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
                onClick={handleReset}
                className="flex-1 border border-gray-300 px-3 py-2 rounded text-sm hover:bg-gray-50 bg-white text-center"
              >
                Reset
              </button>
              <button
                type="submit"
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