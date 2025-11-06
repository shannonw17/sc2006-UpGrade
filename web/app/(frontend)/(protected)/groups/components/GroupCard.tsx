"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { joinGroup } from "@/app/(backend)/GroupController/joinGroup";
import { leaveGroup } from "@/app/(backend)/GroupController/leaveGroup";
import ReportGroup from "./reportGroup";

interface GroupCardProps {
  group: any;
  isHost: boolean;
  isJoined: boolean;
  isFull: boolean;
  count: number;
  CURRENT_USER_ID: string;
  showEdit: boolean;
  onEditClick?: (group: any) => void;
}

// ---- date/time helpers (dd/mm/yyyy + 12-hour time) ----
const fmtDate = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const fmtTime = new Intl.DateTimeFormat("en-SG", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function formatGroupWhen(startISO: string | Date, endISO?: string | Date) {
  const start = new Date(startISO);
  const end = endISO ? new Date(endISO) : undefined;
  const date = fmtDate.format(start); // -> dd/mm/yyyy
  const timeStart = fmtTime.format(start);
  const timeEnd = end ? fmtTime.format(end) : undefined;
  return timeEnd ? `${date}, ${timeStart} - ${timeEnd}` : `${date}, ${timeStart}`;
}

export default function GroupCard({
  group,
  isHost,
  isJoined,
  isFull,
  count,
  CURRENT_USER_ID,
  showEdit,
  onEditClick,
}: GroupCardProps) {
  const router = useRouter();
  const [showReportModal, setShowReportModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const getHighlightColor = () => {
    if (isHost) return "bg-green-500";
    if (isJoined) return "bg-blue-500";
    if (isFull) return "bg-gray-400";
    return "bg-orange-500";
  };

  const handleJoinGroup = async () => {
    if (!confirm(`Are you sure you want to join "${group.name}"?`)) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("groupId", group.id);
      formData.append("userId", CURRENT_USER_ID);
      await joinGroup(formData);
      router.refresh();
    } catch (err: any) {
      alert(`Failed to join group: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm(`Are you sure you want to leave "${group.name}"?`)) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("groupId", group.id);
      formData.append("userId", CURRENT_USER_ID);
      await leaveGroup(formData);
      router.refresh();
    } catch (err: any) {
      alert(`Failed to leave group: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditGroup = () => {
    if (onEditClick) onEditClick(group);
  };

  const getFromTab = () => (showEdit ? "mine" : "all");

  const getActionButton = () => {
    if (isHost && showEdit)
      return (
        <button
          onClick={handleEditGroup}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-medium px-4 py-2 rounded-full hover:opacity-90 transition text-sm"
        >
          Edit group
        </button>
      );

    if (isHost && !showEdit)
      return (
        <div className="w-full bg-gray-100 text-gray-400 font-medium px-4 py-2 rounded-full text-sm text-center">
          Your group
        </div>
      );

    if (isJoined)
      return (
        <button
          onClick={handleLeaveGroup}
          disabled={isProcessing}
          className="w-full bg-gray-500 text-white font-medium px-4 py-2 rounded-full hover:bg-gray-600 transition text-sm disabled:opacity-50"
        >
          {isProcessing ? "Leaving..." : "Leave"}
        </button>
      );

    return (
      <button
        onClick={handleJoinGroup}
        disabled={isFull || isProcessing}
        className={`w-full font-medium px-4 py-2 rounded-full transition text-sm ${
          isFull
            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
            : "bg-gradient-to-r from-black to-blue-700 text-white hover:opacity-90"
        }`}
      >
        {isProcessing ? "Joining..." : isFull ? "Full" : "Join"}
      </button>
    );
  };

  const when = formatGroupWhen(group.start, group.end);

  return (
    <>
      <div className="flex border border-gray-200 rounded-lg shadow-sm bg-white">
        {/* Highlight Bar */}
        <div className={`w-2 rounded-l-lg ${getHighlightColor()}`}></div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between">
            {/* Left side - Group Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="font-semibold text-gray-900 text-lg">
                  {group.name}
                </div>

                {isHost && (
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                    Host
                  </span>
                )}

                {/* Tags Display */}
                {group.tags && group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {group.tags[0] && (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                        #{group.tags[0].name}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="text-gray-600 text-sm">
                {when} • {group.location}
              </div>
            </div>

            {/* Right side - Buttons */}
            <div className="flex items-center gap-4">
              <Link
                href={`/groups/${group.id}?fromTab=${getFromTab()}`}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm whitespace-nowrap"
              >
                view details
              </Link>

              <div className="text-gray-800 font-medium text-sm whitespace-nowrap min-w-[100px] text-right">
                {count}/{group.capacity} members
              </div>

              <div className="w-32">{getActionButton()}</div>

              {!isHost && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium whitespace-nowrap"
                >
                  report
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportGroup
          groupId={group.id}
          groupName={group.name}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
}