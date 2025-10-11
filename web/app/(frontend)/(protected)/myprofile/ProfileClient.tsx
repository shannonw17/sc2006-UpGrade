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

  const renderField = (label: string, field: string, value: any, editable = true, type = "text") => {
    if (!editable) {
      return (
        <div className="flex items-start mb-4">
          <label className="font-semibold w-40 text-left mr-4 pt-2 flex-shrink-0">{label}</label>
          <div className="flex-1 border border-gray-300 rounded bg-white px-4 py-2">
            {value}
          </div>
        </div>
      );
    }

    if (field === "yearOfStudy") {
      return (
        <div className="flex items-start mb-4">
          <label className="font-semibold w-40 text-left mr-4 pt-2 flex-shrink-0">{label}</label>
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
      );
    }

    if (field === "gender") {
      return (
        <div className="flex items-start mb-4">
          <label className="font-semibold w-40 text-left mr-4 pt-2 flex-shrink-0">{label}</label>
          {isEditing ? (
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange("gender", e.target.value)}
              className="flex-1 border border-gray-300 rounded px-4 py-2 bg-white"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          ) : (
            <div className="flex-1 border border-gray-300 rounded bg-white px-4 py-2">
              {user.mapGender}
            </div>
          )}
        </div>
      );
    }

    if (field === "emailReminder") {
      return (
        <div className="flex items-start mb-4">
          <label className="font-semibold w-40 text-left mr-4 pt-2 flex-shrink-0">{label}</label>
          <div className="flex-1 flex items-center">
            {isEditing ? (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.emailReminder}
                  onChange={(e) => handleInputChange("emailReminder", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            ) : (
              <label className="relative inline-flex items-center cursor-not-allowed">
                <input
                  type="checkbox"
                  checked={formData.emailReminder}
                  disabled
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start mb-4">
        <label className="font-semibold w-40 text-left mr-4 pt-2 flex-shrink-0">{label}</label>
        {isEditing ? (
          <input
            type={type}
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="flex-1 border border-gray-300 rounded px-4 py-2"
            placeholder={label.includes("Optional") ? "(Optional)" : ""}
          />
        ) : (
          <div className="flex-1 border border-gray-300 rounded bg-white px-4 py-2">
            {formData[field] || <span className="text-gray-400">(Optional)</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <main className="flex-1 p-10 flex flex-col items-center">
        <div className="bg-white shadow-lg rounded-lg p-10 w-full max-w-6xl">
          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-2">
              {renderField("Email:", "email", formData.email, true, "email")}
              {renderField("Year of study:", "yearOfStudy", user.mapYear, true)}
              {renderField("Education Level:", "eduLevel", user.mapEdu, false)}
              {renderField("Gender:", "gender", user.mapGender, true)}
              {renderField("Current course:", "school", formData.school, true)}
              {renderField("Relevant subjects/modules:", "relevantSubjects", formData.relevantSubjects, true)}
              {renderField("Preferred study location(s):", "preferredLocations", formData.preferredLocations, true)}
              {renderField("School/ Institution:", "schoolInstitution", formData.schoolInstitution, true)}
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
              {renderField("Preferred study timing:", "preferredTiming", formData.preferredTiming, true)}
              {renderField("Usual study duration:", "usualStudyPeriod", formData.usualStudyPeriod, true)}
              {renderField("Academic grades/ CGPA:", "academicGrades", formData.academicGrades, true)}
            </div>
          </div>

          {/* Action Buttons */}
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
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-black via-indigo-900 to-blue-700 text-white px-12 py-3 rounded-lg hover:from-gray-900 hover:via-indigo-800 hover:to-blue-600 font-semibold"
                >
                  Edit profile
                </button>
                <button className="bg-red-500 text-white px-12 py-3 rounded-lg hover:bg-red-600 font-semibold">
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}