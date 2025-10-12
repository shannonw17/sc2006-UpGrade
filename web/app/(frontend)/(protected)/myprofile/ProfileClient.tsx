"use client";

import React, { useState } from "react";

export default function ProfileClient({ user }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user.email,
    yearOfStudy: user.yearOfStudy,
    gender: user.gender,
    school: user.school || "",
    relevantSubjects: user.relevantSubjects || "",
    preferredLocations: user.preferredLocations || "",
    schoolInstitution: user.schoolInstitution || "",
    preferredTiming: user.preferredTiming || "",
    usualStudyPeriod: user.usualStudyPeriod || "",
    academicGrades: user.academicGrades || "",
    emailReminder: user.emailReminder || false,
  });

  const handleSave = async () => {
    // Placeholder: add an API route later to update the user
    console.log("Saving data:", formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      email: user.email,
      yearOfStudy: user.yearOfStudy,
      gender: user.gender,
      school: user.school || "",
      relevantSubjects: user.relevantSubjects || "",
      preferredLocations: user.preferredLocations || "",
      schoolInstitution: user.schoolInstitution || "",
      preferredTiming: user.preferredTiming || "",
      usualStudyPeriod: user.usualStudyPeriod || "",
      academicGrades: user.academicGrades || "",
      emailReminder: user.emailReminder || false,
    });
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderField = (label: string, field: string, value: any, editable = true, type = "text", exampleText = "") => {
    if (!editable) {
      return (
        <div className="flex flex-col mb-6">
          <div className="flex items-start">
            <label className="font-semibold w-48 text-left mr-6 pt-2 flex-shrink-0">{label}</label>
            <div className="flex-1 border border-gray-300 rounded bg-white px-4 py-2">
              {value}
            </div>
          </div>
        </div>
      );
    }

    if (field === "yearOfStudy") {
      return (
        <div className="flex flex-col mb-6">
          <div className="flex items-start">
            <label className="font-semibold w-48 text-left mr-6 pt-2 flex-shrink-0">{label}</label>
            {isEditing ? (
              <select
                value={formData.yearOfStudy}
                onChange={(e) => handleInputChange("yearOfStudy", e.target.value)}
                className="flex-1 border border-gray-300 rounded px-4 py-2 bg-white"
              >
                {user.yearOptions.map((opt: any) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex-1 border border-gray-300 rounded bg-white px-4 py-2">
                {user.mapYear}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (field === "gender") {
      return (
        <div className="flex flex-col mb-6">
          <div className="flex items-start">
            <label className="font-semibold w-48 text-left mr-6 pt-2 flex-shrink-0">{label}</label>
            {/* Gender is always non-editable - removed the editing condition */}
            <div className="flex-1 border border-gray-300 rounded bg-white px-4 py-2">
              {user.mapGender}
            </div>
          </div>
        </div>
      );
    }

    if (field === "emailReminder") {
      return (
        <div className="flex flex-col mb-6">
          <div className="flex items-start">
            <label className="font-semibold w-48 text-left mr-6 pt-2 flex-shrink-0">{label}</label>
            <div className="flex-1 flex items-center">
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => handleInputChange("emailReminder", !formData.emailReminder)}
                  className={`relative inline-flex items-center h-8 rounded-full w-16 transition-colors duration-300 ${
                    formData.emailReminder ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-300 shadow-md ${
                      formData.emailReminder ? 'translate-x-9' : 'translate-x-1'
                    }`}
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => isEditing && handleInputChange("emailReminder", !formData.emailReminder)}
                  className={`relative inline-flex items-center h-8 rounded-full w-16 transition-colors duration-300 ${
                    formData.emailReminder ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-300 shadow-md ${
                      formData.emailReminder ? 'translate-x-9' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}
              <span className="ml-3 text-gray-700">
                {formData.emailReminder ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col mb-6">
        <div className="flex items-start">
          <label className="font-semibold w-48 text-left mr-6 pt-2 flex-shrink-0">{label}</label>
          <div className="flex-1">
            {isEditing ? (
              <input
                type={type}
                value={formData[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2 bg-white"
                placeholder=""
              />
            ) : (
              <div className="w-full border border-gray-300 rounded bg-white px-4 py-2">
                {formData[field] || <span className="text-gray-400">Not specified</span>}
              </div>
            )}
          </div>
        </div>
        {isEditing && exampleText && (
          <div className="flex mt-1">
            <div className="w-48 mr-6"></div>
            <p className="text-xs text-gray-500 italic">
              {exampleText}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <main className="flex-1 p-10 flex flex-col items-center">
        <div className="bg-gray-100 shadow-lg rounded-lg p-10 w-full max-w-6xl">
          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-2">
              {/* Email is now non-editable */}
              {renderField("Email:", "email", formData.email, false, "email")}
              {renderField("Year of study:", "yearOfStudy", user.mapYear, true)}
              {renderField("Education Level:", "eduLevel", user.mapEdu, false)}
              {/* Gender is non-editable */}
              {renderField("Gender:", "gender", user.mapGender, false)}
              {renderField("Current course:", "school", formData.school, true, "text", "e.g., Computer Science, Information Systems")}
              {renderField("Relevant subjects/modules:", "relevantSubjects", formData.relevantSubjects, true, "text", "e.g., SC2006, SC2005, SC2001")}
              {renderField("Preferred study location(s):", "preferredLocations", formData.preferredLocations, true, "text", "e.g., NTU, Jurong, Yishun")}
              {renderField("School/ Institution:", "schoolInstitution", formData.schoolInstitution, true, "text", "e.g., Nanyang Technological University")}
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-8">
                <div className="bg-gradient-to-r from-black via-indigo-900 to-blue-700 rounded-full w-40 h-40 flex items-center justify-center text-white text-6xl font-bold">
                  {user.username[0].toUpperCase()}
                </div>
                <p className="mt-4 font-semibold text-2xl">{user.username}</p>
                <a href="#" className="text-sm text-blue-600 hover:underline mt-1">
                  Change password
                </a>
              </div>

              {/* Right Column Fields */}
              {renderField("Email reminders:", "emailReminder", formData.emailReminder, true)}
              {renderField("Preferred study timing:", "preferredTiming", formData.preferredTiming, true, "text", "e.g., 8am–12pm, 6pm onwards")}
              {renderField("Usual study duration:", "usualStudyPeriod", formData.usualStudyPeriod, true, "text", "e.g., 2–3 hours per day")}
              {renderField("Academic grades/ CGPA:", "academicGrades", formData.academicGrades, true, "text", "e.g., 4.20 / 5.00")}
            </div>
          </div>

          {/* Action Buttons - Removed Logout Button */}
          <div className="flex justify-center gap-4 mt-10">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-black via-indigo-900 to-blue-700 text-white px-12 py-3 rounded-lg hover:from-gray-900 hover:via-indigo-800 hover:to-blue-600 font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-400 text-white px-12 py-3 rounded-lg hover:bg-gray-500 font-semibold"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-black via-indigo-900 to-blue-700 text-white px-12 py-3 rounded-lg hover:from-gray-900 hover:via-indigo-800 hover:to-blue-600 font-semibold"
              >
                Edit profile
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}