"use client";
import { createGroup } from "@/app/(backend)/GroupController/createGroups";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CreateGroupPage() {
  const [location, setLocation] = useState("");
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [mainTag, setMainTag] = useState(""); // Compulsory main tag
  const [additionalTags, setAdditionalTags] = useState<string[]>([]); // Optional additional tags
  const [currentAdditionalTag, setCurrentAdditionalTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnedLocation = searchParams.get("loc");

  useEffect(() => {
    const savedForm = sessionStorage.getItem("createGroupForm");
    if (savedForm) {
      const obj = JSON.parse(savedForm);
      setName(obj.name || "");
      setVisibility(obj.visibility || "public");
      setStartDate(obj.startDate || "");
      setStartTime(obj.startTime || "");
      setEndDate(obj.endDate || "");
      setEndTime(obj.endTime || "");
      setCapacity(Number(obj.capacity) || 4);
      setLocation(obj.location || "");
      setMainTag(obj.mainTag || "");
      setAdditionalTags(obj.additionalTags || []);
      sessionStorage.removeItem("createGroupForm");
    }

    const savedLocation = sessionStorage.getItem("selectedLocation");
    if (savedLocation) {
      setLocation(savedLocation);
      sessionStorage.removeItem("selectedLocation");
    }

    if (returnedLocation) setLocation(returnedLocation);
  }, [returnedLocation]);

  const goToMap = () => {
    const formState = {
      name,
      visibility,
      startDate,
      startTime,
      endDate,
      endTime,
      capacity: capacity.toString(),
      location,
      mainTag,
      additionalTags,
    };
    sessionStorage.setItem("createGroupForm", JSON.stringify(formState));
    router.push("/Maps");
  };

  const addAdditionalTag = () => {
    const trimmedTag = currentAdditionalTag.trim();
    if (trimmedTag && !additionalTags.includes(trimmedTag) && additionalTags.length < 4) { // Max 4 additional tags
      if (trimmedTag.length > 20) {
        setError("Tag cannot exceed 20 characters");
        return;
      }
      if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedTag)) {
        setError("Tag can only contain letters, numbers, spaces, hyphens, and underscores");
        return;
      }
      setAdditionalTags([...additionalTags, trimmedTag]);
      setCurrentAdditionalTag("");
      setError("");
    }
  };

  const removeAdditionalTag = (tagToRemove: string) => {
    setAdditionalTags(additionalTags.filter(tag => tag !== tagToRemove));
  };

  const handleAdditionalTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAdditionalTag();
    }
  };

  const validateDuration = () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      return true;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    const durationInMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
    
    return durationInMinutes >= 30;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!mainTag.trim()) {
      setError("Main tag is required");
      return;
    }
    if (mainTag.length > 20) {
      setError("Main tag cannot exceed 20 characters");
      return;
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(mainTag)) {
      setError("Main tag can only contain letters, numbers, spaces, hyphens, and underscores");
      return;
    }

    if (!validateDuration()) {
      setError("Study group duration must be at least 30 minutes");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const start = `${startDate}T${startTime}`;
      const end = `${endDate}T${endTime}`;
      
      const formData = new FormData(e.currentTarget);
      formData.set('start', start);
      formData.set('end', end);
      
      const allTags = [mainTag, ...additionalTags];
      formData.set('tags', allTags.join(','));
      
      await createGroup(formData);
    } catch (error: any) {
      if (!error?.digest?.startsWith('NEXT_REDIRECT')) {
        setError(error.message || "Failed to create group");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDuration = () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      return null;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    const durationInMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
    
    if (durationInMinutes < 0) {
      return "Invalid: End time must be after start time";
    }
    
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = Math.round(durationInMinutes % 60);
    
    if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };

  const durationText = calculateDuration();
  const isValidDuration = validateDuration();

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a New Group</h1>
          <p className="text-gray-600">Set up your study group and start collaborating</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 30))} // Limit to 30 characters
                placeholder="Enter group name (max 30 characters)"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                maxLength={30}
              />
              <p className="text-xs text-gray-500 mt-1">
                {30 - name.length} characters remaining
              </p>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility <span className="text-red-500">*</span>
              </label>
              <select
                name="visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="public">Public - Anyone can join</option>
                <option value="private">Private - Invite only</option>
              </select>
            </div>

            {/* Main Compulsory Tag */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Tag <span className="text-red-500">*</span>
                {mainTag.length > 0 && <span className="text-gray-500 text-xs ml-2">({mainTag.length}/20)</span>}
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={mainTag}
                  onChange={(e) => setMainTag(e.target.value.slice(0, 20))}
                  placeholder="Enter main tag (e.g., Mathematics, Programming, Biology)"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  maxLength={20}
                />
                
                {/* Main Tag Display */}
                {mainTag && (
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium border-2 border-blue-300">
                      {mainTag}
                      <span className="text-blue-600 text-xs ml-1">(Main)</span>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500">
                  This is the primary tag that describes your group. It will be prominently displayed.
                </p>
              </div>
            </div>

            {/* Additional Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Tags {additionalTags.length > 0 && <span className="text-gray-500 text-xs">({additionalTags.length}/4)</span>}
              </label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentAdditionalTag}
                    onChange={(e) => setCurrentAdditionalTag(e.target.value)}
                    onKeyPress={handleAdditionalTagKeyPress}
                    placeholder="Add additional tag (max 20 characters)"
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={addAdditionalTag}
                    disabled={!currentAdditionalTag.trim() || additionalTags.length >= 4}
                    className="rounded-lg bg-gray-600 text-white px-4 py-3 hover:bg-gray-700 transition-colors font-medium whitespace-nowrap disabled:opacity-50"
                  >
                    Add Tag
                  </button>
                </div>
                
                {/* Additional Tags Display */}
                {additionalTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {additionalTags.map((tag, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeAdditionalTag(tag)}
                          className="text-gray-600 hover:text-gray-800 ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-gray-500">
                  Add up to 4 additional tags to help others find your group. These are optional.
                </p>
              </div>
            </div>

            {/* Start Date & Time */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date</label>
                    <input
                      name="startDate"
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Time</label>
                    <input
                      name="startTime"
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* End Date & Time */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  End Date & Time <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date</label>
                    <input
                      name="endDate"
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Time</label>
                    <input
                      name="endTime"
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                {/* Duration Display */}
                {durationText && (
                  <div className={`mt-3 p-3 rounded-lg border ${
                    isValidDuration && !durationText.includes('Invalid') 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {isValidDuration && !durationText.includes('Invalid') ? (
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">
                          Duration: {durationText}
                          {!isValidDuration && !durationText.includes('Invalid') && (
                            <span className="block text-xs mt-1">
                              Minimum study group duration is 30 minutes
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-3">
                <input
                  name="location"
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location or select on map"
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <button
                  type="button"
                  onClick={goToMap}
                  className="rounded-lg bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                >
                  Select on Map
                </button>
              </div>
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-3">
                <input
                  name="capacity"
                  type="number"
                  min={2}
                  max={50}
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-32 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <span className="text-gray-500 text-sm">members (Min: 2, Max: 50)</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Cannot create group</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button 
                type="button"
                onClick={() => router.push("/groups")}
                disabled={isSubmitting}
                className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting || !mainTag.trim() || !isValidDuration}
                className="rounded-lg bg-gradient-to-r from-black to-blue-700 px-6 py-3 text-white font-medium hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Group"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}