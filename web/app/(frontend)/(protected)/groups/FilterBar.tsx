"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function FilterBar() {
  const sp = useSearchParams();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [from, setFrom] = useState(sp.get("from") ?? "");
  const [to, setTo] = useState(sp.get("to") ?? "");
  const [loc, setLoc] = useState(sp.get("loc") ?? "");
  const [openOnly, setOpenOnly] = useState(sp.get("open") === "1");

  useEffect(() => {
    setQ(sp.get("q") ?? "");
    setFrom(sp.get("from") ?? "");
    setTo(sp.get("to") ?? "");
    setLoc(sp.get("loc") ?? "");
    setOpenOnly(sp.get("open") === "1");
  }, [sp]);

  return (
    <form method="GET" className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-6 gap-3 px-2">
      {/* preserve active tab */}
      <input type="hidden" name="tab" value={sp.get("tab") ?? "all"} />

      <input
        name="q"
        placeholder="Search name…"
        className="col-span-2 rounded border px-3 py-2"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <input
        type="datetime-local"
        name="from"
        className="rounded border px-3 py-2"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
      />

      <input
        type="datetime-local"
        name="to"
        className="rounded border px-3 py-2"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />

      <input
        name="loc"
        placeholder="Location contains…"
        className="rounded border px-3 py-2"
        value={loc}
        onChange={(e) => setLoc(e.target.value)}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="open"
          value="1"
          checked={openOnly}
          onChange={(e) => setOpenOnly(e.target.checked)}
        />
        Only groups with space
      </label>

      <div className="md:col-span-6 flex gap-2 justify-end">
        <a href={`/groups?tab=${sp.get("tab") ?? "all"}`} className="rounded border px-3 py-2 text-sm hover:bg-black/5">
          Reset
        </a>
        <button className="rounded bg-black text-white px-3 py-2 text-sm hover:bg-black/80">
          Apply
        </button>
      </div>
    </form>
  );
}
