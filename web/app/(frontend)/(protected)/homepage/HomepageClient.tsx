'use client';

import { useState, useRef, useEffect } from 'react';
import { viewOtherProfile } from '@/app/(backend)/ProfileController/viewOtherProfile';

async function handleLogout() {
  try {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (response.ok) window.location.href = '/login';
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

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
  
  const filterPopupRef = useRef<HTMLDivElement>(null);
  const profileModalRef = useRef<HTMLDivElement>(null);

  // Close filter popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPopupRef.current && !filterPopupRef.current.contains(event.target as Node)) {
        setShowFilterPopup(false);
      }
      if (profileModalRef.current && !profileModalRef.current.contains(event.target as Node) && showProfileModal) {
        setShowProfileModal(false);
        setSelectedProfile(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterPopup, showProfileModal]);

  useEffect(() => {
    if (messages.length > 0) {
      for (const msg of messages) {
        alert(`[in-website alert] ${msg}`);
      }
    }
  }, [messages]);

  // Handle view profile - DIRECT SERVER ACTION CALL
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

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfile(null);
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
      {/* Error Message */}
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
                  <h1 className="text-3xl font-bold text-emerald-900 bg-green-100 px-4 py-2 rounded-lg mb-2 inline-block border border-red-200">{selectedProfile.username}
                  </h1>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                  </div>
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
                <button className="flex-1 bg-gradient-to-r from-black to-blue-700 text-white font-medium px-6 py-3 rounded-lg hover:opacity-90 transition">
                  + Invite to Study
                </button>
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

                <button className="bg-gradient-to-r from-black to-blue-700 text-white font-medium px-6 py-2 rounded-full hover:opacity-90 transition text-sm">
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