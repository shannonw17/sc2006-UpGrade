// app/(frontend)/(protected)/groups/components/reportGroup.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { sendReport } from "@/app/(backend)/ReportController/sendReport";

interface ReportGroupProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
}

const REPORT_TYPES = [
  { value: "VULGARITIES", label: "Vulgar Language" },
  { value: "SEXUAL_CONTENT", label: "Sexual Content" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "HARMFUL_ACTS", label: "Harmful Acts" },
  { value: "SPAM", label: "Spam" },
  { value: "MISINFORMATION", label: "Misinformation" },
];

export default function ReportGroup({ groupId, groupName, onClose }: ReportGroupProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTypes.length === 0) {
      setError("Please select at least one reason");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("groupId", groupId);
      formData.append("types", JSON.stringify(selectedTypes));
      await sendReport(formData);
      alert("Report submitted successfully!");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Box */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Report Group</h2>
        <p className="text-gray-600 mb-4">
          Reporting: <span className="font-medium">{groupName}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Select reasons:
            </p>
            <div className="space-y-2">
              {REPORT_TYPES.map((type) => (
                <label key={type.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type.value)}
                    onChange={() => handleTypeToggle(type.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedTypes.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
