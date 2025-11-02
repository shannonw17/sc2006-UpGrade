// app/(frontend)/(protected)/groups/components/EditGroupModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateGroup } from '@/app/(backend)/GroupController/updateGroup';

interface EditGroupModalProps {
  group: any;
  onClose: () => void;
  onUpdate: () => void;
}

// Helper function to convert UTC date to local datetime string for input
function utcToLocalDatetimeString(utcDate: Date): string {
  const date = new Date(utcDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function EditGroupModal({ group, onClose, onUpdate }: EditGroupModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(group.location);
  const [visibility, setVisibility] = useState(group.visibility ? "public" : "private");
  const router = useRouter();
  
  const [mainTag, setMainTag] = useState(group.tags?.[0]?.name || "");
  const [additionalTags, setAdditionalTags] = useState<string[]>(group.tags?.slice(1).map((tag: any) => tag.name) || []);
  const [currentAdditionalTag, setCurrentAdditionalTag] = useState("");
  const [nameLength, setNameLength] = useState(group.name.length);

  useEffect(() => {
    const savedLocation = sessionStorage.getItem('selectedLocation');
    if (savedLocation) {
      setLocation(savedLocation);
      sessionStorage.removeItem('selectedLocation');
    }
  }, []);

  const goToMap = () => {
    const formState = {
      name: group.name,
      location: location,
      visibility: visibility,
      start: utcToLocalDatetimeString(new Date(group.start)),
      end: utcToLocalDatetimeString(new Date(group.end)),
      capacity: group.capacity.toString(),
      tags: [mainTag, ...additionalTags],
      isEdit: true,
      groupId: group.id
    };
    sessionStorage.setItem('editGroupForm', JSON.stringify(formState));
    router.push('/Maps');
  };

  const addAdditionalTag = () => {
    const trimmedTag = currentAdditionalTag.trim();
    if (trimmedTag && !additionalTags.includes(trimmedTag) && additionalTags.length < 4) {
      if (trimmedTag.length > 25) {
        setError("Tag cannot exceed 25 characters");
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!mainTag.trim()) {
      setError("Main tag is required");
      return;
    }
    
    const allTags = [mainTag, ...additionalTags];
    if (allTags.length === 0) {
      setError("At least one tag is required");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      formData.append('groupId', group.id);
      formData.append('visibility', visibility);
      formData.append('tags', allTags.join(','));
      
      await updateGroup(formData);
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameLength(e.target.value.length);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Modal Container */}
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md mx-auto max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Group</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name <span className="text-red-500">*</span>
                {nameLength > 0 && <span className="text-gray-500 text-xs ml-2">({nameLength}/30)</span>}
              </label>
              <input
                type="text"
                name="name"
                defaultValue={group.name}
                onChange={handleNameChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                maxLength={30}
              />
            </div>

            {/* Visibility Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="visibility-display"
                    value="public"
                    checked={visibility === "public"}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    <span className="font-medium">Public</span> - Anyone can join
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="visibility-display"
                    value="private"
                    checked={visibility === "private"}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    <span className="font-medium">Private</span> - Invite only
                  </span>
                </label>
              </div>
            </div>

            {/* Main Tag */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Tag <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={mainTag}
                onChange={(e) => setMainTag(e.target.value)}
                placeholder="Enter main tag (required)"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                maxLength={25}
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the primary tag that describes your group
              </p>
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
                    placeholder="Add additional tag (optional)"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    maxLength={25}
                  />
                  <button
                    type="button"
                    onClick={addAdditionalTag}
                    disabled={!currentAdditionalTag.trim() || additionalTags.length >= 4}
                    className="rounded-lg bg-gray-600 text-white px-3 py-2 hover:bg-gray-700 transition-colors font-medium whitespace-nowrap text-sm disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                
                {/* Additional Tags Display */}
                {additionalTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {additionalTags.map((tag, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeAdditionalTag(tag)}
                          className="text-green-600 hover:text-green-800 ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-gray-500">
                  Add up to 4 additional tags to describe your group. Total tags: {1 + additionalTags.length}/5
                </p>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  name="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  placeholder="Enter location or select on map"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <button
                  type="button"
                  onClick={goToMap}
                  className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors font-medium whitespace-nowrap text-sm"
                >
                  Select on Map
                </button>
              </div>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="start"
                defaultValue={utcToLocalDatetimeString(new Date(group.start))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="end"
                defaultValue={utcToLocalDatetimeString(new Date(group.end))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="capacity"
                defaultValue={group.capacity}
                min={group.currentSize}
                max={50}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current members: {group.currentSize} (Min: {group.currentSize}, Max: 50)
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !mainTag.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Updating...' : 'Update Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}