'use client';

import { useState, useRef, useEffect } from 'react';
import { viewOtherProfile } from '@/app/(backend)/ProfileController/viewOtherProfile';
import { sendInvite } from '@/app/(backend)/InvitationController/sendInvite';
import { getUserGroups } from '@/app/(backend)/GroupController/getUserGroups';

export default function HomepageClient({ user, initialProfiles, messages }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [filteredProfiles, setFilteredProfiles] = useState(initialProfiles);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [studyDuration, setStudyDuration] = useState(1);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Invite functionality states
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterPopup, showProfileModal, showInviteModal]);

  // Handle view profile
  const handleViewProfile = async (targetUserId: string) => {
    setLoadingProfileId(targetUserId);
    setError(null);
    
    try {
      const result = await viewOtherProfile(targetUserId);

      if (result.success) {
        setSelectedProfile(result.profile);
        setShowProfileModal(true);
      } else {
        setError(result.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('View profile error:', error);
      setError('Failed to load profile');
    } finally {
      setLoadingProfileId(null);
    }
  };

  // Handle invite button click
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
        setError('Failed to load your groups');
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      setError('Failed to load your groups');
    } finally {
      setLoadingGroups(false);
    }
  };

  // Handle sending invite
  const handleSendInvite = async (groupId: string, groupName: string) => {
    if (!selectedUserForInvite) return;
    
    setInviteLoading(groupId);
    setInviteSuccess(null);
    setInviteError(null);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('groupId', groupId);
      formData.append('receiverUsername', selectedUserForInvite.username);

      const result = await sendInvite(formData);
      
      if (result.ok) {
        setInviteSuccess(`Invite sent to ${selectedUserForInvite.username} for group "${groupName}"!`);
      } else {
        const errorMessages = {
          'missing-fields': 'Missing required fields',
          'group-not-found': 'Group not found',
          'forbidden': 'You do not have permission to invite to this group',
          'group-closed': 'This group is closed',
          'group-full': 'This group is full',
          'user-not-found': 'User not found',
          'cannot-invite-self': 'You cannot invite yourself',
          'already-member': 'User is already a member of this group',
          'invite-already-sent': 'Invite has already been sent to this user',
          'internal-error': 'Internal server error'
        };
        
        const errorMessage = errorMessages[result.error] || result.error;
        
        // Show "invite already sent" in the popup, others in main error area
        if (result.error === 'invite-already-sent') {
          setInviteError(`Failed to send invite: ${errorMessage}`);
        } else {
          setError(`Failed to send invite: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Send invite error:', error);
      setError('Failed to send invite');
    } finally {
      setInviteLoading(null);
    }
  };

  // Close modals
  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfile(null);
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setSelectedUserForInvite(null);
    setInviteSuccess(null);
    setInviteError(null);
    setUserGroups([]);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredProfiles(profiles);
      return;
    }
    const filtered = profiles.filter(profile =>
      profile.username.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProfiles(filtered);
  };

  const applyFilters = () => {
    let filtered = profiles;
    if (searchQuery) {
      filtered = filtered.filter(profile =>
        profile.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (yearFilter) filtered = filtered.filter(profile => profile.year === yearFilter);
    if (genderFilter) filtered = filtered.filter(profile => profile.gender === genderFilter);
    setFilteredProfiles(filtered);
    setShowFilterPopup(false);
  };

  const increaseDuration = () => setStudyDuration(prev => prev + 1);
  const decreaseDuration = () => setStudyDuration(prev => (prev > 1 ? prev - 1 : 1));

  const clearAllFilters = () => {
    setSearchQuery('');
    setYearFilter('');
    setGenderFilter('');
    setStudyDuration(1);
    setFilteredProfiles(profiles);
    setShowFilterPopup(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Main Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600 text-center">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Profile Detail Modal */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div 
            ref={profileModalRef}
            className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={closeProfileModal}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ← Back to profiles
                  </button>
                  <button
                    onClick={closeProfileModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <h1 className="text-3xl font-bold text-emerald-900 bg-green-100 px-4 py-2 rounded-lg mb-2 inline-block border border-red-200">
                  {selectedProfile.username}
                </h1>
              </div>

              {/* Profile Details Card */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <div className="grid gap-4">
                  <DetailItem label="Username" value={selectedProfile.username} />
                  <DetailItem label="Email" value={selectedProfile.email} />
                  <DetailItem label="Education Level" value={selectedProfile.eduLevel} />
                  <DetailItem label="Year of Study" value={selectedProfile.yearOfStudy} />
                  <DetailItem label="Gender" value={selectedProfile.gender} />
                  <DetailItem label="Preferred Timing" value={selectedProfile.preferredTiming} />
                  <DetailItem 
                    label="Preferred Locations" 
                    value={selectedProfile.preferredLocations || 'Not specified'} 
                  />
                  <DetailItem 
                    label="Current Course" 
                    value={selectedProfile.currentCourse || 'Not specified'} 
                  />
                  <DetailItem 
                    label="Relevant Subjects" 
                    value={selectedProfile.relevantSubjects || 'Not specified'} 
                  />
                  <DetailItem 
                    label="School" 
                    value={selectedProfile.school || 'Not specified'} 
                  />
                  <DetailItem 
                    label="Usual Study Period" 
                    value={selectedProfile.usualStudyPeriod || 'Not specified'} 
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => handleInviteClick(selectedProfile)}
                  className="flex-1 bg-gradient-to-r from-black to-blue-700 text-white font-medium px-6 py-3 rounded-lg hover:opacity-90 transition"
                >
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
          <div 
            ref={inviteModalRef}
            className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Invite {selectedUserForInvite.username}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Select a group to invite this user to
                  </p>
                </div>
                <button
                  onClick={closeInviteModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Success Message */}
              {inviteSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-600 text-center">{inviteSuccess}</p>
                </div>
              )}

              {/* Invite Error Message (shown in popup) */}
              {inviteError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600 text-center">{inviteError}</p>
                  <button 
                    onClick={() => setInviteError(null)}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Groups List */}
              <div className="space-y-4">
                {loadingGroups ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading your groups...</p>
                  </div>
                ) : userGroups.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No groups available</h3>
                    <p className="text-gray-600 mb-4">
                      You need to be a host or member of a public group to send invites.
                    </p>
                    <a 
                      href="/groups/create" 
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Create a group →
                    </a>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4">
                      {userGroups.map((group) => (
                        <div
                          key={group.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{group.name}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                group.userRole === 'host' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {group.userRole === 'host' ? 'Host' : 'Member'}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                group.visibility 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {group.visibility ? 'Public' : 'Private'}
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
                            ) : (
                              'Send Invite'
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Create Group CTA */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900">Want to create a new group?</h4>
                          <p className="text-blue-700 text-sm mt-1">Create a study group and invite {selectedUserForInvite.username} to join.</p>
                        </div>
                        <a 
                          href="/groups/create" 
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
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
            <button
              onClick={() => setShowFilterPopup(!showFilterPopup)}
              className="border border-gray-300 px-4 py-2 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 bg-white"
            >
              Filter
            </button>

            {showFilterPopup && (
              <div className="absolute top-12 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64 z-10">
                <div className="space-y-4">
                  {/* Year Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-white"
                    >
                      <option value="">All Years</option>
                      <option value="Year 1">Year 1</option>
                      <option value="Year 2">Year 2</option>
                      <option value="Year 3">Year 3</option>
                      <option value="Year 4">Year 4</option>
                    </select>
                  </div>

                  {/* Gender Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-white"
                    >
                      <option value="">All Genders</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Study Duration Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Study Duration
                    </label>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={decreaseDuration}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 bg-white"
                      >
                        -
                      </button>
                      <div className="flex-1 mx-3 text-center">
                        <span className="text-lg text-gray-700">{studyDuration}</span>
                        <span className="text-sm text-gray-700 ml-1">
                          hour{studyDuration !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <button
                        onClick={increaseDuration}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 bg-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Apply & Clear Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={applyFilters}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700"
                    >
                      Apply
                    </button>
                    <button
                      onClick={clearAllFilters}
                      className="flex-1 bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900 bg-white"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm"
            >
              <div className="flex flex-col items-center text-center">
                <div className="font-semibold text-gray-900 text-lg mb-1">
                  {profile.username}
                </div>
                <div className="text-gray-800 mb-1">
                  <span className={`px-2 py-1 text-sm font-bold ${profile.yearColor}`}>
                    {profile.year}
                  </span>
                </div>
                <div className="text-gray-600 mb-3">({profile.gender})</div>

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
                  ) : (
                    'view profile'
                  )}
                </button>

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
              {searchQuery ? `No profiles found for "${searchQuery}"` : 'No profiles found'}
            </div>
            <div className="text-gray-500 text-sm">
              {searchQuery && 'Try searching with a different username'}
            </div>
            {(searchQuery || yearFilter || genderFilter || studyDuration > 1) && (
              <button
                onClick={clearAllFilters}
                className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear search & filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// DetailItem component for consistent styling
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
      <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}