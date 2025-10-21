// app/(frontend)/(protected)/groups/components/GroupCard.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { joinGroup } from '@/app/(backend)/GroupController/joinGroup';
import { leaveGroup } from '@/app/(backend)/GroupController/leaveGroup';
import ReportGroup from './reportGroup';

interface GroupCardProps {
  group: any;
  isHost: boolean;
  isJoined: boolean;
  isFull: boolean;
  count: number;
  CURRENT_USER_ID: string;
  showEdit: boolean;
}

export default function GroupCard({ 
  group, 
  isHost, 
  isJoined, 
  isFull, 
  count, 
  CURRENT_USER_ID,
  showEdit,
}: GroupCardProps) {
  const [showReportModal, setShowReportModal] = useState(false);

  // Determine highlight color based on group status
  const getHighlightColor = () => {
    if (isHost) return "bg-green-500"; // Host's own groups - green
    if (isJoined) return "bg-blue-500"; // Joined groups - blue
    if (isFull) return "bg-gray-400"; // Full groups - gray
    return "bg-orange-500"; // Available groups - orange
  };

  return (
    <>
      <div className="flex border border-gray-200 rounded-lg shadow-sm bg-white">
        {/* Highlight Bar - Left Side */}
        <div className={`w-2 rounded-l-lg ${getHighlightColor()}`}></div>
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between">
            {/* Left side - Group Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="font-semibold text-gray-900 text-lg">
                  {group.name}
                </div>
                {isHost && (
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                    Host
                  </span>
                )}
              </div>
              <div className="text-gray-600 text-sm">
                {new Date(group.start).toLocaleString()} • {group.location}
              </div>
            </div>

            {/* Center - View Details Button */}
            <div className="flex-1 flex justify-center">
              <Link 
                href={`/groups/${group.id}`} 
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                view details
              </Link>
            </div>

            {/* Right side - Members Count and Actions */}
            <div className="flex items-center space-x-4">
              {/* Members Count - Right in front of Join button */}
              <div className="text-gray-800 font-medium text-right min-w-20">
                {count}/{group.capacity} members
              </div>

              {/* Action Button */}
              <div className="w-32">
                {showEdit && isHost ? (
                  <button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-medium px-4 py-2 rounded-full hover:opacity-90 transition text-sm">
                    Edit group
                  </button>
                ) : isJoined ? (
                  <form action={leaveGroup} className="w-full">
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="userId" value={CURRENT_USER_ID} />
                    <button
                      type="submit"
                      className="w-full bg-gray-500 text-white font-medium px-4 py-2 rounded-full hover:bg-gray-600 transition text-sm"
                    >
                      Joined
                    </button>
                  </form>
                ) : (
                  <form action={joinGroup} className="w-full">
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="userId" value={CURRENT_USER_ID} />
                    <button
                      type="submit"
                      disabled={isFull}
                      className={`w-full font-medium px-4 py-2 rounded-full transition text-sm ${
                        isFull 
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed" 
                          : "bg-gradient-to-r from-black to-blue-700 text-white hover:opacity-90"
                      }`}
                    >
                      {isFull ? "Full" : "Join"}
                    </button>
                  </form>
                )}
              </div>

              {/* Report Button - Red */}
              {!isHost && ( // Don't allow hosts to report their own groups
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
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