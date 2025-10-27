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

  // Load location from session storage when component mounts
  useEffect(() => {
    const savedLocation = sessionStorage.getItem('selectedLocation');
    if (savedLocation) {
      setLocation(savedLocation);
      sessionStorage.removeItem('selectedLocation');
    }
  }, []);

  const goToMap = () => {
    // Save current form state to session storage
    const formState = {
      name: group.name,
      location: location,
      visibility: visibility,
      start: utcToLocalDatetimeString(new Date(group.start)),
      end: utcToLocalDatetimeString(new Date(group.end)),
      capacity: group.capacity.toString(),
      isEdit: true,
      groupId: group.id
    };
    sessionStorage.setItem('editGroupForm', JSON.stringify(formState));
    router.push('/Maps');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      formData.append('groupId', group.id);
      formData.append('visibility', visibility);
      
      await updateGroup(formData);
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Modal Container */}
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md mx-auto">
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
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name
              </label>
              <input
                type="text"
                name="name"
                defaultValue={group.name}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
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
                Start Time
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
                End Time
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
                Capacity
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
              disabled={isSubmitting}
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