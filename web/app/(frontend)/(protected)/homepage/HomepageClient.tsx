"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { viewOtherProfile } from "@/app/(backend)/ProfileController/viewOtherProfile";
import { sendInvite } from "@/app/(backend)/InvitationController/sendInvite";
import { getUserGroups } from "@/app/(backend)/GroupController/getUserGroups";
import { filterProfilesAction } from "@/app/(backend)/FilterController/filterProfiles";

type Filters = {
  searchQuery: string;
  yearFilter: string;
  genderFilter: string;
  timingFilter: string; // CSV
};

// ✅ 1) Types that match what you render
type UserCard = {
  id: string;
  email: string;
  username: string;
  gender: string;        // You can swap to Prisma enum types if desired
  yearOfStudy: string;   // e.g. "U1" | "U2" | ...
  eduLevel: string;      // "SEC" | "JC" | "POLY" | "UNI"
  preferredTiming: string;
  preferredLocations: string;
  currentCourse: string | null;
  relevantSubjects: string | null;
  school: string | null;
  usualStudyPeriod: string | null;
};

// ✅ 2) Discriminated union for server action result
type FilterSuccess = {
  success: true;
  profiles: UserCard[];
  total: number;
  page: { take: number; skip: number; count: number };
};
type FilterError = { success: false; error: string };
type FilterResp = FilterSuccess | FilterError;

// Helper function to get year display text
const getYearDisplay = (yearOfStudy: string): string => {
  const yearMap: Record<string, string> = {
    S1: "Sec 1", S2: "Sec 2", S3: "Sec 3", S4: "Sec 4", S5: "Sec 5",
    J1: "JC 1", J2: "JC 2",
    P1: "Poly 1", P2: "Poly 2", P3: "Poly 3",
    U1: "Year 1", U2: "Year 2", U3: "Year 3", U4: "Year 4",
  };
  return yearMap[yearOfStudy] || yearOfStudy;
};

// Helper function to get year color class
const getYearColor = (yearOfStudy: string): string => {
  const yearDisplay = getYearDisplay(yearOfStudy);
  const colorMap: Record<string, string> = {
    'Sec 1': 'bg-red-100 text-red-800',
    'Sec 2': 'bg-orange-100 text-orange-800',
    'Sec 3': 'bg-amber-100 text-amber-800',
    'Sec 4': 'bg-yellow-100 text-yellow-800',
    'Sec 5': 'bg-lime-100 text-lime-800',
    'JC 1': 'bg-green-100 text-green-800',
    'JC 2': 'bg-emerald-100 text-emerald-800',
    'Poly 1': 'bg-cyan-100 text-cyan-800',
    'Poly 2': 'bg-blue-100 text-blue-800',
    'Poly 3': 'bg-indigo-100 text-indigo-800',
    'Year 1': 'bg-red-100 text-red-800',
    'Year 2': 'bg-yellow-100 text-yellow-800',
    'Year 3': 'bg-blue-100 text-blue-800',
    'Year 4': 'bg-green-100 text-green-800',
  };
  return colorMap[yearDisplay] || 'bg-gray-100 text-gray-800';
};

// Helper function to format gender for display
const formatGender = (gender: string): string => {
  const genderMap: Record<string, string> = {
    MALE: "Male",
    FEMALE: "Female", 
    OTHER: "Other",
  };
  return genderMap[gender] || gender;
};

// Helper function to format preferred timing for display
const formatPreferredTiming = (preferredTiming: string): string => {
  if (!preferredTiming) return "Not specified";
  
  // Split by comma and format each timing
  const timings = preferredTiming.split(',').map(timing => {
    const trimmed = timing.trim();
    // Capitalize first letter of each timing
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  });
  
  return timings.join(', ');
};

export default function HomepageClient({
  user,
  initialProfiles,
  messages,
  initialTotal = 0,
  initialFilters = { searchQuery: "", yearFilter: "", genderFilter: "", timingFilter: "" },
}: {
  user: any;
  initialProfiles: UserCard[];
  messages: string[];
  initialTotal?: number;
  initialFilters?: Filters;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Format initial profiles on client side
  const formatProfiles = (profiles: UserCard[]) => {
    return profiles.map(profile => ({
      ...profile,
      // Format for display but keep original for filtering
      displayYear: getYearDisplay(profile.yearOfStudy),
      displayGender: formatGender(profile.gender),
      displayTiming: formatPreferredTiming(profile.preferredTiming),
      yearColor: getYearColor(profile.yearOfStudy),
    }));
  };

  // ⬇️ fix: this is an array of UserCard, not a single UserCard
  const [profiles, setProfiles] = useState<UserCard[]>(formatProfiles(initialProfiles));
  const [total, setTotal] = useState(initialTotal);

  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery || "");
  const [yearFilter, setYearFilter] = useState(initialFilters.yearFilter || "");
  const [genderFilter, setGenderFilter] = useState(initialFilters.genderFilter || "");
  const [timingFilter, setTimingFilter] = useState<string[]>(
    initialFilters.timingFilter ? initialFilters.timingFilter.split(",").map(s => s.trim()).filter(Boolean) : []
  );

  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null); // NEW: Store userId separately
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Invite states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUserForInvite, setSelectedUserForInvite] = useState<any>(null);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [inviteLoading, setInviteLoading] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const filterPopupRef = useRef<HTMLDivElement>(null);
  const profileModalRef = useRef<HTMLDivElement>(null);
  const inviteModalRef = useRef<HTMLDivElement>(null);

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPopupRef.current && !filterPopupRef.current.contains(event.target as Node)) {
        setShowFilterPopup(false);
      }
      if (profileModalRef.current && !profileModalRef.current.contains(event.target as Node) && showProfileModal) {
        setShowProfileModal(false);
        setSelectedProfile(null);
      }
      if (inviteModalRef.current && !inviteModalRef.current.contains(event.target as Node) && showInviteModal) {
        closeInviteModal();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterPopup, showProfileModal, showInviteModal]);

  // Backend: view profile
  const handleViewProfile = async (targetUserId: string) => {
    setLoadingProfileId(targetUserId);
    setSelectedProfileUserId(targetUserId); // NEW: Store userId separately
    setError(null);
    try {
      const result = await viewOtherProfile(targetUserId);
      if (result.success) {
        setSelectedProfile(result.profile);
        setShowProfileModal(true);
      } else {
        setError(result.message || "Failed to load profile");
      }
    } catch (e) {
      console.error("View profile error:", e);
      setError("Failed to load profile");
    } finally {
      setLoadingProfileId(null);
    }
  };

  // Backend: invite modal + groups
  const handleInviteClick = async (profile: any) => {
    setSelectedUserForInvite(profile);
    setLoadingGroups(true);
    setInviteSuccess(null);
    setInviteError(null);
    setError(null);
    try {
      const result = await getUserGroups();
      if (result.success) {
        setUserGroups(result.groups || []);
        setShowInviteModal(true);
      } else {
        setError("Failed to load your groups");
      }
    } catch (e) {
      console.error("Error loading groups:", e);
      setError("Failed to load your groups");
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleSendInvite = async (groupId: string, groupName: string) => {
    if (!selectedUserForInvite) return;
    setInviteLoading(groupId);
    setInviteSuccess(null);
    setInviteError(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("groupId", groupId);
      formData.append("receiverUsername", selectedUserForInvite.username);
      const result = await sendInvite(formData);

      if (result.ok) {
        setInviteSuccess(`Invite sent to ${selectedUserForInvite.username} for group "${groupName}"!`);
      } else {
        const map: Record<string, string> = {
          "missing-fields": "Missing required fields",
          "group-not-found": "Group not found",
          forbidden: "You do not have permission to invite to this group",
          "group-closed": "This group is closed",
          "group-full": "This group is full",
          "user-not-found": "User not found",
          "cannot-invite-self": "You cannot invite yourself",
          "already-member": "User is already a member of this group",
          "invite-already-sent": "Invite has already been sent to this user",
          "internal-error": "Internal server error",
        };
        const msg = map[result.error] || result.error;
        if (result.error === "invite-already-sent") setInviteError(`Failed to send invite: ${msg}`);
        else setError(`Failed to send invite: ${msg}`);
      }
    } catch (e) {
      console.error("Send invite error:", e);
      setError("Failed to send invite");
    } finally {
      setInviteLoading(null);
    }
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setSelectedUserForInvite(null);
    setInviteSuccess(null);
    setInviteError(null);
    setUserGroups([]);
  };

  // NEW: Message user function - Requirement 1.3.1
  const handleMessageUser = (userId: string) => {
    console.log('handleMessageUser called with userId:', userId);
    
    if (!userId) {
      console.error('Invalid userId - value is:', userId);
      setError('Invalid user ID');
      return;
    }
    
    // Navigate to chats page with userId
    // The chat interface will handle creating a new conversation or opening existing one
    console.log('Navigating to chats with userId:', userId);
    router.push(`/chats?newChatWith=${userId}`);
  };

  // Timing options (unchanged)
  const timingOptions = [
    { value: "Morning", label: "Morning (6am-12pm)" },
    { value: "Afternoon", label: "Afternoon (12pm-6pm)" },
    { value: "Evening", label: "Evening (6pm-12am)" },
    { value: "Night", label: "Night (12am-6am)" },
  ];

  const handleTimingChange = (timing: string) => {
    setTimingFilter((prev) => (prev.includes(timing) ? prev.filter((t) => t !== timing) : [...prev, timing]));
  };

  // --- The important part: CALL BACKEND to filter
  const runBackendFilter = async (opts?: { closePopup?: boolean; pushUrl?: boolean; 
    filters?: {
    search: string;
    year: string;
    gender: string;
    timings: string[];
  };
  }) => {
    setLoadingList(true);
    setError(null);

    const f = opts?.filters ?? {
    search: searchQuery,
    year: yearFilter,
    gender: genderFilter,
    timings: timingFilter,
  };

    const form = new FormData();
  form.append("searchQuery", f.search);
  form.append("yearFilter", f.year);
  form.append("genderFilter", f.gender);
  form.append("timingFilter", f.timings.join(","));
  form.append("take", "24");
  form.append("skip", "0");
  if (user?.eduLevel) form.append("eduLevel", user.eduLevel);
  if (user?.id)       form.append("excludeUserId", user.id);

  try {
    const res = (await filterProfilesAction(form)) as FilterResp;

    if (res.success) {
      // Format the profiles from backend before setting state
      const formattedProfiles = formatProfiles(res.profiles);
      setProfiles(formattedProfiles);
      setTotal(res.total ?? 0);

      if (opts?.pushUrl) {
        const params = new URLSearchParams();
        if (f.search) params.set("query", f.search);
        if (f.year) params.set("year", f.year);
        if (f.gender) params.set("gender", f.gender);
        if (f.timings.length) params.set("timing", f.timings.join(","));
        const qs = params.toString();
        router.replace(qs ? `/homepage?${qs}` : "/homepage");
      }
    } else {
      setError(res.error || "Failed to filter profiles");
    }
  } catch (e) {
    console.error("filter error:", e);
    setError("Server error while filtering profiles");
  } finally {
    setLoadingList(false);
    if (opts?.closePopup) setShowFilterPopup(false);
  }
};

  // Apply button → backend filter + close popup + update URL
  const applyFilters = () => runBackendFilter({ closePopup: true, pushUrl: true });

// Clear button → reset filters, close popup, and refresh to defaults (single click)
const clearAllFilters = (e?: React.MouseEvent) => {
  e?.preventDefault();

  const defaults = { search: "", year: "", gender: "", timings: [] as string[] };

  // Reset UI state
  setSearchQuery(defaults.search);
  setYearFilter(defaults.year);
  setGenderFilter(defaults.gender);
  setTimingFilter(defaults.timings);

  // Call backend immediately with the defaults (avoid stale state)
  runBackendFilter({ closePopup: true, pushUrl: true, filters: defaults });
};

  // Search box: optional debounce → backend filter + update URL
// 🔁 Debounced search — runs when searchQuery changes, including empty string
const firstLoadRef = useRef(true);

useEffect(() => {
  // ⛔ skip the very first render to avoid double-loading initialProfiles
  if (firstLoadRef.current) {
    firstLoadRef.current = false;
    return;
  }

  // 🕒 debounce 250ms so it doesn't fire on every keystroke
  const id = setTimeout(() => {
    runBackendFilter({ pushUrl: true });
  }, 250);

  return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchQuery]);


  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Notifications */}
      <Toaster position="top-right" containerStyle={{ top: "10px", right: "200px" }} />
      <style jsx>{`
        .animate-enter { animation: fadeIn 0.3s ease-out forwards; }
        .animate-leave { animation: fadeOut 0.3s ease-in forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px);} to { opacity: 1; transform: translateY(0);} }
        @keyframes fadeOut { from { opacity: 1; transform: translateY(0);} to { opacity: 0; transform: translateY(-10px);} }
      `}</style>
     

      {/* Main Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600 text-center">{error}</p>
          <button onClick={() => setError(null)} className="mt-2 text-sm text-red-600 hover:text-red-800">
            Dismiss
          </button>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div ref={profileModalRef} className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => { setShowProfileModal(false); setSelectedProfile(null); }} className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                    ← Back to profiles
                  </button>
                  <button onClick={() => { setShowProfileModal(false); setSelectedProfile(null); }} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                <h1 className="text-3xl font-bold text-emerald-900 bg-green-100 px-4 py-2 rounded-lg mb-2 inline-block border border-red-200">
                  {selectedProfile.username}
                </h1>
                {/* DEBUG: Show the ID */}
                <p className="text-xs text-gray-400 mt-2">User ID: {selectedProfile.id || 'MISSING'}</p>
              </div>

              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <div className="grid gap-4">
                  <DetailItem label="Username" value={selectedProfile.username} />
                  <DetailItem label="Email" value={selectedProfile.email} />
                  <DetailItem label="Education Level" value={selectedProfile.eduLevel} />
                  <DetailItem label="Year of Study" value={selectedProfile.yearOfStudy} />
                  <DetailItem label="Gender" value={selectedProfile.gender} />
                  <DetailItem label="Preferred Timing" value={selectedProfile.preferredTiming} />
                  <DetailItem label="Preferred Locations" value={selectedProfile.preferredLocations || "Not specified"} />
                  <DetailItem label="Current Course" value={selectedProfile.currentCourse || "Not specified"} />
                  <DetailItem label="Relevant Subjects" value={selectedProfile.relevantSubjects || "Not specified"} />
                  <DetailItem label="School" value={selectedProfile.school || "Not specified"} />
                  <DetailItem label="Usual Study Period" value={selectedProfile.usualStudyPeriod || "Not specified"} />
                </div>
              </div>

              {/* MODIFIED: Added Message button - Requirement 1.3.1 */}
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => handleMessageUser(selectedProfileUserId || selectedProfile.id)} 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium px-6 py-3 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message User
                </button>
                <button onClick={() => handleInviteClick(selectedProfile)} className="flex-1 bg-gradient-to-r from-black to-blue-700 text-white font-medium px-6 py-3 rounded-lg hover:opacity-90 transition">
                  + Invite to Study
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && selectedUserForInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div ref={inviteModalRef} className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Invite {selectedUserForInvite.username}</h2>
                  <p className="text-gray-600 text-sm mt-1">Select a group to invite this user to</p>
                </div>
                <button onClick={closeInviteModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {inviteSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-600 text-center">{inviteSuccess}</p>
                </div>
              )}

              {inviteError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600 text-center">{inviteError}</p>
                  <button onClick={() => setInviteError(null)} className="mt-2 text-sm text-red-600 hover:text-red-800">Dismiss</button>
                </div>
              )}

              <div className="space-y-4">
                {loadingGroups ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                    <p className="text-gray-600 mt-2">Loading your groups...</p>
                  </div>
                ) : userGroups.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No groups available</h3>
                    <p className="text-gray-600 mb-4">You need to be a host or member of a public group to send invites.</p>
                    <a href="/groups/create" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">Create a group →</a>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4">
                      {userGroups.map((group) => (
                        <div key={group.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{group.name}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${group.userRole === "host" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                                {group.userRole === "host" ? "Host" : "Member"}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${group.visibility ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                                {group.visibility ? "Public" : "Private"}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>👥 {group.currentSize}/{group.capacity} members</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSendInvite(group.id, group.name)}
                            disabled={inviteLoading === group.id}
                            className="bg-gradient-to-r from-black to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {inviteLoading === group.id ? (
                              <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                              </span>
                            ) : ("Send Invite")}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900">Want to create a new group?</h4>
                          <p className="text-blue-700 text-sm mt-1">Create a study group and invite {selectedUserForInvite.username} to join.</p>
                        </div>
                        <a href="/groups/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                          Create Group
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All profiles</h1>

        <div className="flex space-x-4">
          {/* Filter Button */}
          <div className="relative" ref={filterPopupRef}>
            <button onClick={() => setShowFilterPopup(!showFilterPopup)} className="border border-gray-300 px-4 py-2 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 bg-white">
              Filter
            </button>

            {showFilterPopup && (
              <div className="absolute top-12 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64 z-10">
                <div className="space-y-4">
                  {/* Year Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-white">
                      <option value="">All Years</option>
                      <option value="Year 1">Year 1</option>
                      <option value="Year 2">Year 2</option>
                      <option value="Year 3">Year 3</option>
                      <option value="Year 4">Year 4</option>
                    </select>
                  </div>

                  {/* Gender Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-white">
                      <option value="">All Genders</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Preferred Timing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Study Timing</label>
                    <div className="space-y-2">
                      {timingOptions.map((option) => (
                        <label key={option.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={timingFilter.includes(option.value)}
                            onChange={() => handleTimingChange(option.value)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Apply & Clear */}
                  <div className="flex space-x-2 pt-2">
                    <button type="button" onClick={applyFilters} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700">
                      Apply
                    </button>
                    <button type="button" onClick={clearAllFilters} className="flex-1 bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600">
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Bar (debounced -> backend, instant reset on clear) */}
<div className="relative">
  <input
    type="text"
    placeholder="Search by username..."
    value={searchQuery}
    onChange={(e) => {
      const v = e.target.value;
      setSearchQuery(v);
      if (v.trim() === "") {
        // when cleared → fetch the default (no search) list + clean URL
        runBackendFilter({ pushUrl: true });
      }
    }}
    className="border border-gray-300 px-4 py-2 rounded text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900 bg-white"
  />
  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
  </div>
</div>

        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingList ? (
          <div className="col-span-3 text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-600 mt-2">Loading...</p>
          </div>
        ) : profiles.length > 0 ? (
          profiles.map((profile: any) => (
            <div key={profile.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
              <div className="flex flex-col items-center text-center">
                {/* Username */}
                <div className="font-semibold text-gray-900 text-lg mb-2">{profile.username}</div>
                
                {/* Year with colored badge */}
                <div className="mb-2">
                  <span className={`px-3 py-1 text-sm font-bold rounded-full ${profile.yearColor}`}>
                    {profile.displayYear}
                  </span>
                </div>

                {/* Gender and Preferred Timing */}
                <div className="text-sm text-gray-600 mb-3">
                  <div className="mb-4">({profile.displayGender})</div>
                  <div>Preferred timings: {profile.displayTiming}</div>
                </div>

                {/* View Profile Button */}
                <button
                  onClick={() => handleViewProfile(profile.id)}
                  disabled={loadingProfileId === profile.id}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm mb-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingProfileId === profile.id ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </span>
                  ) : ("view profile")}
                </button>

                {/* Invite Button */}
                <button 
                  onClick={() => handleInviteClick(profile)} 
                  className="bg-gradient-to-r from-black to-blue-700 text-white font-medium px-6 py-2 rounded-full hover:opacity-90 transition text-sm"
                >
                  + Invite
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 col-span-3 bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-gray-600 text-lg mb-2">
              {searchQuery ? `No profiles found for "${searchQuery}"` : "No profiles found"}
            </div>
            <div className="text-gray-500 text-sm">
              {searchQuery && "Try searching with a different username"}
            </div>
            {(searchQuery || yearFilter || genderFilter || timingFilter.length > 0) && (
              <button onClick={clearAllFilters} className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">
                Clear search & filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
      <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}