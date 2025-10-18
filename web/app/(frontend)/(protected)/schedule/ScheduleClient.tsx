// app/(frontend)/(protected)/schedule/ScheduleClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type StudyGroup = {
  id: string;
  name: string;
  location: string;
  start: string | Date;
  end: string | Date;
  description?: string;
  capacity?: number;
  hostId?: string;
  groupID?: string;
  currentSize?: number;
  visibility?: boolean;
  createdAt?: string | Date;
  host?: {
    username: string;
  };
  members?: Array<{
    userId: string;
    user: {
      username: string;
      email: string;
    };
  }>;
};

// Generate consistent color per group
function getColor(id: string) {
  const colors = [
    "bg-blue-500", "bg-green-500", "bg-yellow-500",
    "bg-red-500", "bg-purple-500", "bg-pink-500",
    "bg-indigo-500", "bg-orange-500", "bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function ScheduleClient({ studyGroups }: { studyGroups: StudyGroup[] }) {
  const [viewMode, setViewMode] = useState<"monthly" | "weekly">("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const router = useRouter();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Group by date with safe handling
  const groupedByDate = useMemo(() => {
    const map: Record<string, StudyGroup[]> = {};
    const safeStudyGroups = Array.isArray(studyGroups) ? studyGroups : [];
    
    safeStudyGroups.forEach((g) => {
      if (!g || !g.start) return;
      
      try {
        const dateKey = new Date(g.start).toDateString();
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(g);
      } catch (error) {
        console.error("Error processing study group:", error);
      }
    });
    return map;
  }, [studyGroups]);

  // Group by date and time for weekly view
  const weeklyGroupedByDate = useMemo(() => {
    const map: Record<string, StudyGroup[]> = {};
    const safeStudyGroups = Array.isArray(studyGroups) ? studyGroups : [];
    
    safeStudyGroups.forEach((g) => {
      if (!g || !g.start) return;
      
      try {
        const dateKey = new Date(g.start).toDateString();
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(g);
      } catch (error) {
        console.error("Error processing study group:", error);
      }
    });
    
    // Sort groups by start time within each date
    Object.keys(map).forEach(date => {
      map[date].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    });
    
    return map;
  }, [studyGroups]);

  // Navigation functions
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  
  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };
  
  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };
  
  // Today function - jump back to current date
  const goToToday = () => setCurrentDate(new Date());

  // Monthly grid
  const startOfMonth = new Date(year, month, 1);
  const startDay = startOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthDays = useMemo(() => {
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  }, [year, month, startDay, daysInMonth]);

  // Weekly grid (Sunday–Saturday)
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  type TimeSlot = {
  time: Date;
  label: string;
  isMidnight: boolean;
};

  // Time slots for weekly view (12am to 11pm)
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const period = hour < 12 ? 'AM' : 'PM';
      const displayHour = hour === 0 ? 12 : 
                         hour > 12 ? hour - 12 : hour;
      
      slots.push({
        time: new Date(0, 0, 0, hour, 0, 0),
        label: `${displayHour} ${period}`,
        isMidnight: hour === 0
      });
    }
    return slots;
  }, []);

  // Check if current view is today (for hiding the Today button)
  const isTodayView = useMemo(() => {
    const today = new Date();
    if (viewMode === "monthly") {
      return today.getMonth() === month && today.getFullYear() === year;
    } else {
      const weekStart = new Date(startOfWeek);
      const weekEnd = new Date(startOfWeek);
      weekEnd.setDate(weekStart.getDate() + 6);
      return today >= weekStart && today <= weekEnd;
    }
  }, [viewMode, month, year, startOfWeek]);

  // FIXED: Calculate group position and height for weekly view
  const getGroupPosition = (group: StudyGroup) => {
    const start = new Date(group.start);
    const end = new Date(group.end);
    
    // Calculate minutes from start of day (12:00 AM = 0 minutes)
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    let endMinutes = end.getHours() * 60 + end.getMinutes();
    
    // Handle events that end at midnight (12:00 AM)
    // If end time is 12:00 AM and it's the same day, treat it as end of day
    if (endMinutes === 0 && end.getDate() === start.getDate()) {
      endMinutes = 1440; // End of day (24 hours * 60 minutes)
    }
    
    // Calculate duration in minutes
    let duration = endMinutes - startMinutes;
    
    // Handle overnight events (like 10pm-12am) - they should span to end of day
    if (duration < 0) {
      duration = 1440 - startMinutes; // Span from start time to end of day
    }
    
    // Ensure minimum duration for visibility (at least 30 minutes)
    const minDuration = 30;
    if (duration < minDuration) {
      duration = minDuration;
    }
    
    // Calculate percentages based on 1440 minutes in a day
    const topPercentage = (startMinutes / 1440) * 100;
    const heightPercentage = (duration / 1440) * 100;
    
    // Calculate minimum height in pixels (at least 40px for readability)
    const minHeightPixels = 40;
    const totalDayHeight = 1200; // 24 hours * 50px per hour
    const calculatedHeightPixels = (duration / 1440) * totalDayHeight;
    const finalMinHeight = Math.max(minHeightPixels, calculatedHeightPixels);
    
    return {
      top: `${topPercentage}%`,
      height: `${heightPercentage}%`,
      minHeight: `${finalMinHeight}px`
    };
  };

  // Handle view details click - show modal
  const handleViewDetails = (group: StudyGroup, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedGroup(group);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setSelectedGroup(null);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  // Safely get study groups count
  const studyGroupsCount = Array.isArray(studyGroups) ? studyGroups.length : 0;

  return (
    <main className="p-6 bg-gray-50 min-h-screen overflow-x-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Study Group Schedule</h1>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1.5 rounded-lg font-medium transition-all text-sm ${
                viewMode === "monthly"
                  ? "bg-gradient-to-r from-black to-blue-700 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setViewMode("monthly")}
            >
              Monthly
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg font-medium transition-all text-sm ${
                viewMode === "weekly"
                  ? "bg-gradient-to-r from-black to-blue-700 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setViewMode("weekly")}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={viewMode === "monthly" ? prevMonth : prevWeek}
            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-sm"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold text-cyan-700">
            {viewMode === "monthly" 
              ? currentDate.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })
              : `Week of ${startOfWeek.toLocaleDateString("default", {
                  month: "short",
                  day: "numeric",
                })}`
            }
          </h2>
          <button
            onClick={viewMode === "monthly" ? nextMonth : nextWeek}
            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-sm"
          >
            →
          </button>
        </div>

        {/* Calendar Grid */}
        {viewMode === "monthly" ? (
          <div className="grid grid-cols-7 gap-2 overflow-x-auto">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700 text-sm mb-1">
                {day}
              </div>
            ))}

            {monthDays.map((date, idx) =>
              date ? (
                <div
                  key={idx}
                  className="border rounded-lg p-1.5 min-h-[120px] hover:shadow-sm bg-white transition relative overflow-y-auto overflow-x-hidden"
                >
                  <div className="absolute top-1 right-1 text-gray-400 text-xs font-semibold">
                    {date.getDate()}
                  </div>

                  {groupedByDate[date.toDateString()]?.length ? (
                    <div className="mt-4 flex flex-col gap-1.5">
                      {groupedByDate[date.toDateString()].map((group) => (
                        <div
                          key={group.id}
                          className={`p-2 rounded text-white ${getColor(group.id)} cursor-pointer hover:opacity-90 transition shadow-sm`}
                        >
                          <p className="font-bold text-xs truncate mb-0.5">{group.name}</p>
                          <p className="text-[10px] mb-0.5 opacity-90">
                            📍 {group.location}
                          </p>
                          <p className="text-[10px] mb-1">
                            {new Date(group.start).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(group.end).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <button
                            onClick={(e) => handleViewDetails(group, e)}
                            className="text-[10px] italic underline font-medium hover:no-underline w-full text-left"
                          >
                            view details
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-300 text-xs">
                      —
                    </div>
                  )}
                </div>
              ) : (
                <div key={idx} className="border rounded-lg bg-gray-100 min-h-[120px]" />
              )
            )}
          </div>
        ) : (
          // Weekly View with Time Sidebar - FIXED POSITIONING
          <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
            <div className="flex">
              {/* Time Sidebar */}
              <div className="w-16 flex-shrink-0 bg-gray-50 border-r border-gray-200">
                <div className="h-10 border-b border-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-500 font-medium">Time</span>
                </div>
                <div className="relative" style={{ height: '1200px' }}>
                  {timeSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="h-10 flex items-start justify-center text-[10px] text-gray-500 border-t border-gray-100 first:border-t-0"
                      style={{ height: '50px' }}
                    >
                      <span className={`mt-0.5 ${slot.isMidnight ? 'font-semibold text-gray-700' : ''}`}>
                        {slot.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Days Grid */}
              <div className="flex-1 overflow-x-auto">
                <div className="flex min-w-max">
                  {weekDays.map((date, dayIndex) => (
                    <div 
                      key={dayIndex} 
                      className="flex-1 min-w-32 border-r border-gray-200 last:border-r-0"
                    >
                      {/* Day Header */}
                      <div className="h-10 border-b border-gray-200 flex flex-col items-center justify-center bg-white">
                        <div className="text-xs font-semibold text-gray-700 uppercase">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-sm font-bold ${
                          date.toDateString() === new Date().toDateString() 
                            ? 'text-blue-600' 
                            : 'text-gray-900'
                        }`}>
                          {date.getDate()}
                        </div>
                      </div>

                      {/* Time Slots Container */}
                      <div className="relative bg-white" style={{ height: '1200px' }}>
                        {/* Hour grid lines */}
                        {timeSlots.map((_, index) => (
                          <div
                            key={index}
                            className="border-t border-gray-100"
                            style={{ height: '50px' }}
                          ></div>
                        ))}

                        {/* Study Groups - FIXED POSITIONING */}
                        {weeklyGroupedByDate[date.toDateString()]?.map((group) => {
                          const position = getGroupPosition(group);
                          const startTime = new Date(group.start);
                          const endTime = new Date(group.end);
                          
                          return (
                            <div
                              key={group.id}
                              className={`absolute left-0.5 right-0.5 rounded ${getColor(group.id)} text-white cursor-pointer hover:opacity-90 transition shadow-sm border border-white border-opacity-30 overflow-hidden`}
                              style={{
                                top: position.top,
                                height: position.height,
                                minHeight: position.minHeight,
                                zIndex: 10,
                              }}
                              onClick={(e) => handleViewDetails(group, e)}
                            >
                              <div className="p-1.5 h-full flex flex-col">
                                {/* Group Name */}
                                <div className="font-bold text-xs leading-tight mb-0.5 line-clamp-1">
                                  {group.name}
                                </div>
                                
                                {/* Location */}
                                <div className="text-[10px] mb-0.5 flex items-start gap-0.5">
                                  <span className="text-[8px]">📍</span>
                                  <span className="line-clamp-1 flex-1">{group.location}</span>
                                </div>
                                
                                {/* Time */}
                                <div className="text-[10px] font-medium mb-0.5">
                                  {startTime.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })} - {endTime.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                                
                                {/* View Details */}
                                <div className="text-[10px] italic underline mt-auto">
                                  view details
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Current time indicator */}
                        {date.toDateString() === new Date().toDateString() && (
                          <div
                            className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
                            style={{
                              top: `${(new Date().getHours() * 60 + new Date().getMinutes()) / 1440 * 100}%`
                            }}
                          >
                            <div className="w-2 h-2 bg-red-500 rounded-full -ml-1 -mt-1"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {studyGroupsCount === 0 && (
          <p className="text-center text-gray-500 mt-6 text-sm">
            You haven't joined any study groups yet.
          </p>
        )}

        {/* Floating Today Button */}
        {!isTodayView && (
          <button
            onClick={goToToday}
            className="fixed bottom-4 right-4 bg-gradient-to-r from-black to-blue-700 hover:from-blue-800 hover:to-blue-900 text-white px-3 py-2 rounded-full shadow-lg font-medium transition-all duration-200 hover:shadow-xl z-50 text-sm"
          >
            Today
          </button>
        )}
      </div>

      {/* Group Profile Modal */}
      {selectedGroup && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-20 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">{selectedGroup.name}</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              {/* Group Status */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  selectedGroup.visibility ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                }`}>
                  {selectedGroup.visibility ? "Public" : "Private"}
                </span>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                  {selectedGroup.currentSize || 0}/{selectedGroup.capacity} members
                </span>
              </div>

              {/* Group Details */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500">Location</span>
                  <span className="text-gray-900 font-medium text-xs">{selectedGroup.location}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500">Start Time</span>
                  <span className="text-gray-900 font-medium text-xs">
                    {new Date(selectedGroup.start).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500">End Time</span>
                  <span className="text-gray-900 font-medium text-xs">
                    {new Date(selectedGroup.end).toLocaleString()}
                  </span>
                </div>
                {selectedGroup.host && (
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-xs font-medium text-gray-500">Host</span>
                    <span className="text-gray-900 font-medium text-xs">{selectedGroup.host.username}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedGroup.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Description</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{selectedGroup.description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-gray-200">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 bg-gradient-to-r from-black to-blue-700 text-white py-2 rounded-lg font-medium hover:opacity-90 transition-all text-sm"
                >
                  Back to Schedule
                </button>
                <Link
                  href={`/groups/${selectedGroup.id}`}
                  className="flex-1 bg-cyan-600 text-white py-2 rounded-lg font-medium hover:bg-cyan-700 transition-colors text-center text-sm"
                  onClick={handleCloseModal}
                >
                  View Full Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}