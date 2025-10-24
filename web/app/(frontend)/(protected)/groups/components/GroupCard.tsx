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
  onEditClick?: (group: any) => void;
}

export default function GroupCard({ 
  group, 
  isHost, 
  isJoined, 
  isFull, 
  count, 
  CURRENT_USER_ID,
  showEdit,
  onEditClick
}: GroupCardProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine highlight color based on group status
  const getHighlightColor = () => {
    if (isHost) return "bg-green-500"; // Host's own groups - green
    if (isJoined) return "bg-blue-500"; // Joined groups - blue
    if (isFull) return "bg-gray-400"; // Full groups - gray
    return "bg-orange-500"; // Available groups - orange
  };

  const handleJoinGroup = async () => {
    if (!confirm(`Are you sure you want to join "${group.name}"?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('groupId', group.id);
      formData.append('userId', CURRENT_USER_ID);
      
      await joinGroup(formData);
      // The page will revalidate and update automatically
    } catch (error: any) {
      alert(`Failed to join group: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm(`Are you sure you want to leave "${group.name}"?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('groupId', group.id);
      formData.append('userId', CURRENT_USER_ID);
      
      await leaveGroup(formData);
      // The page will revalidate and update automatically
    } catch (error: any) {
      alert(`Failed to leave group: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditGroup = () => {
    console.log("handleEditGroup called, onEditClick exists:", !!onEditClick);
    if (onEditClick) {
      onEditClick(group);
    } else {
      console.error("onEditClick is not defined!");
    }
  };

  // SIMPLIFIED: Only use showEdit to determine the tab
  // showEdit = true means we're in "Created groups" tab
  // showEdit = false means we're in "All groups" tab (regardless of join status)
  const getFromTab = () => {
    return showEdit ? 'mine' : 'all';
  };

  const getActionButton = () => {
    // Host's own groups - show Edit button ONLY if showEdit is true (Created groups tab)
    if (isHost && showEdit) {
      return (
        <button 
          onClick={handleEditGroup}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-medium px-4 py-2 rounded-full hover:opacity-90 transition text-sm"
        >
          Edit group
        </button>
      );
    }

    // Host's own groups in All groups tab - show View Only message
    if (isHost && !showEdit) {
      return (
        <div className="w-full bg-gray-100 text-gray-400 font-medium px-4 py-2 rounded-full text-sm text-center">
          Your group
        </div>
      );
    }

    // User has joined this group - show Leave button
    if (isJoined) {
      return (
        <button
          onClick={handleLeaveGroup}
          disabled={isProcessing}
          className="w-full bg-gray-500 text-white font-medium px-4 py-2 rounded-full hover:bg-gray-600 transition text-sm disabled:opacity-50"
        >
          {isProcessing ? 'Leaving...' : 'Leave'}
        </button>
      );
    }

    // User hasn't joined - show Join button (or Full if capacity reached)
    return (
      <button
        onClick={handleJoinGroup}
        disabled={isFull || isProcessing}
        className={`w-full font-medium px-4 py-2 rounded-full transition text-sm ${
          isFull 
            ? "bg-gray-300 text-gray-600 cursor-not-allowed" 
            : "bg-gradient-to-r from-black to-blue-700 text-white hover:opacity-90 disabled:opacity-50"
        }`}
      >
        {isProcessing ? 'Joining...' : isFull ? "Full" : "Join"}
      </button>
    );
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
                href={`/groups/${group.id}?fromTab=${getFromTab()}`}
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
                {getActionButton()}
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