// app/(frontend)/(protected)/groups/components/reportGroup.tsx
"use client";

import { useState } from 'react';
import { sendReport } from '@/app/(backend)/ReportController/sendReport';

interface ReportGroupProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
}

const REPORT_TYPES = [
  { value: 'VULGARITIES', label: 'Vulgar Language' },
  { value: 'SEXUAL_CONTENT', label: 'Sexual Content' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'HARMFUL_ACTS', label: 'Harmful Acts' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'MISINFORMATION', label: 'Misinformation' },
];

export default function ReportGroup({ groupId, groupName, onClose }: ReportGroupProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTypes.length === 0) {
      setError('Please select at least one report type');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('groupId', groupId);
      formData.append('types', JSON.stringify(selectedTypes));

      await sendReport(formData);
      onClose(); // Close modal on success
      // You might want to show a success message here
      alert('Report submitted successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Report Group
        </h2>
        <p className="text-gray-600 mb-4">
          Reporting: <span className="font-medium">{groupName}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select reasons for reporting:
            </label>
            <div className="space-y-2">
              {REPORT_TYPES.map((type) => (
                <label key={type.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type.value)}
                    onChange={() => handleTypeToggle(type.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedTypes.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}