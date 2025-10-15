"use client";

import React, { useState } from "react";

interface ProfileUser {
  id: string;
  email: string;
  username: string;
  gender: string;
  eduLevel: string;
  yearOfStudy: string;
  currentCourse: string | null;
  relevantSubjects: string | null;
  preferredLocations: string;
  school: string | null;
  preferredTiming: string;
  usualStudyPeriod: string | null;
  academicGrades: string | null;
  emailReminder: boolean;
  mapEdu: string;
  mapGender: string;
  mapYear: string;
  yearOptions: { value: string; label: string }[];
  hasWarning: boolean;
}

interface ProfileClientProps {
  user?: ProfileUser;
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const defaultUser: ProfileUser = {
    id: "test-id",
    email: "test@example.com",
    username: "TestUser",
    gender: "MALE",
    eduLevel: "UNI",
    yearOfStudy: "U2",
    currentCourse: "Computer Science",
    relevantSubjects: "SC2006, SC2005, SC2001",
    preferredLocations: "NTU, Jurong",
    school: "Nanyang Technological University",
    preferredTiming: "morning, evening",
    usualStudyPeriod: "2-3 hours",
    academicGrades: "4.5/5.0",
    emailReminder: true,
    mapEdu: "University",
    mapGender: "Male",
    mapYear: "Year 2",
    yearOptions: [
      { value: "U1", label: "Year 1" },
      { value: "U2", label: "Year 2" },
      { value: "U3", label: "Year 3" },
      { value: "U4", label: "Year 4" },
    ],
    hasWarning: false,
  };

  const userData = user || defaultUser;
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  // Helper function to parse comma-separated strings into arrays
  const parseStringToArray = (str: string | null): string[] => {
    if (!str || str.trim() === '') return [];
    // Split by comma, trim each item, and filter out empty strings
    return str.split(',').map(s => s.trim()).filter(s => s.length > 0);
  };

  const [formData, setFormData] = useState({
    email: userData.email,
    yearOfStudy: userData.yearOfStudy,
    gender: userData.gender,
    currentCourse: userData.currentCourse || "",
    relevantSubjects: userData.relevantSubjects || "",
    preferredLocations: parseStringToArray(userData.preferredLocations),
    school: userData.school || "",
    preferredTiming: parseStringToArray(userData.preferredTiming),
    usualStudyPeriod: userData.usualStudyPeriod || "",
    academicGrades: userData.academicGrades || "",
    emailReminder: userData.emailReminder,
  });

  const timingOptions = [
    { value: "morning", label: "Morning (6am-12pm)" },
    { value: "afternoon", label: "Afternoon (12pm-6pm)" },
    { value: "evening", label: "Evening (6pm-12am)" },
    { value: "night", label: "Night (12am-6am)" },
  ];

  const handlePasswordChange = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      alert("Please fill in all password fields!");
      return;
    }
    
    if (passwordData.new !== passwordData.confirm) {
      alert("New passwords do not match!");
      return;
    }
    
    if (passwordData.new.length < 8) {
      alert("Password must be at least 8 characters long!");
      return;
    }

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.current,
          newPassword: passwordData.new,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Password changed successfully!");
        setShowPasswordModal(false);
        setPasswordData({ current: "", new: "", confirm: "" });
      } else {
        alert(data.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert("An error occurred while changing password");
    }
  };

  const handleSave = async () => {
    if (!formData.email) {
      alert("Email is required!");
      return;
    }

    if (!formData.yearOfStudy) {
      alert("Year of study is required!");
      return;
    }

    if (!formData.gender) {
      alert("Gender is required!");
      return;
    }

    if (!formData.currentCourse || formData.currentCourse.trim() === "") {
      alert("Current course is required!");
      return;
    }

    if (!Array.isArray(formData.preferredLocations) || formData.preferredLocations.length === 0) {
      alert("Preferred study location(s) is required!");
      return;
    }

    if (!Array.isArray(formData.preferredTiming) || formData.preferredTiming.length === 0) {
      alert("Please select at least one preferred study timing!");
      return;
    }

    try {
      const { editProfile } = await import("@/app/(backend)/ProfileController/editProfile");
      
      // Filter out empty strings before sending
      const cleanedTiming = formData.preferredTiming.filter(t => t && t.trim().length > 0);
      const cleanedLocations = formData.preferredLocations.filter(l => l && l.trim().length > 0);
      
      console.log("Sending timing:", cleanedTiming);
      console.log("Sending locations:", cleanedLocations);
      
      const result = await editProfile({
        yearOfStudy: formData.yearOfStudy,
        preferredTiming: cleanedTiming,
        preferredLocations: cleanedLocations,
        currentCourse: formData.currentCourse.trim() || null,
        relevantSubjects: formData.relevantSubjects.trim() || null,
        school: formData.school.trim() || null,
        academicGrades: formData.academicGrades.trim() || null,
        usualStudyPeriod: formData.usualStudyPeriod.trim() || null,
        emailReminder: formData.emailReminder,
      });

      if (result.success) {
        setIsEditing(false);
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 3000);
      } else {
        alert(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error instanceof Error ? error.message : "An error occurred while updating profile");
    }
  };

  const handleCancel = () => {
    setFormData({
      email: userData.email,
      yearOfStudy: userData.yearOfStudy,
      gender: userData.gender,
      currentCourse: userData.currentCourse || "",
      relevantSubjects: userData.relevantSubjects || "",
      preferredLocations: parseStringToArray(userData.preferredLocations),
      school: userData.school || "",
      preferredTiming: parseStringToArray(userData.preferredTiming),
      usualStudyPeriod: userData.usualStudyPeriod || "",
      academicGrades: userData.academicGrades || "",
      emailReminder: userData.emailReminder,
    });
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTimingToggle = (value: string) => {
    const current = Array.isArray(formData.preferredTiming) ? formData.preferredTiming : [];
    if (current.includes(value)) {
      handleInputChange("preferredTiming", current.filter((v) => v !== value));
    } else {
      handleInputChange("preferredTiming", [...current, value]);
    }
  };

  const renderField = (label: string, field: string, value: any, editable = true, type = "text", exampleText = "", mandatory = false) => {
    if (!editable) {
      return (
        <div className="flex flex-col mb-6">
          <div className="flex items-start">
            <label className="font-semibold w-48 text-left mr-6 pt-2 flex-shrink-0">
              {label}
              {mandatory && <span className="text-red-500 ml-1">*</span>}
            </label>
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
            <label className="font-semibold w-48 text-left mr-6 pt-2 flex-shrink-0">
              {label}
              {mandatory && <span className="text-red-500 ml-1">*</span>}
            </label>
            {isEditing ? (
              <select
                value={formData.yearOfStudy}
                onChange={(e) => handleInputChange("yearOfStudy", e.target.value)}
                className="flex-1 border border-gray-300 rounded px-4 py-2 bg-white"
              >
                {userData.yearOptions.map((opt: any) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex-1 border border-gray-300 rounded bg-white px-4 py-2">
                {userData.mapYear}
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
            <label className="font-semibold w-48 text-left mr-6 pt-2 flex-shrink-0">
              {label}
              {mandatory && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex-1 border border-gray-300 rounded bg-white px-4 py-2">
              {userData.mapGender}
            </div>
          </div>
        </div>
      );
    }

    if (field === "emailReminder") {
      return (
        <div className="flex flex-col mb-6">
          <div className="flex items-start">
            <label className="font-semibold w-48 text-left mr-6 pt-2 flex-shrink-0">
              {label}
              {mandatory && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex-1 flex items-center">
              <button
                type="button"
                onClick={() => isEditing && handleInputChange("emailReminder", !formData.emailReminder)}
                disabled={!isEditing}
                className={`relative inline-flex items-center h-8 rounded-full w-16 transition-colors duration-300 ${
                  formData.emailReminder ? 'bg-green-500' : 'bg-gray-300'
                } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-300 shadow-md ${
                    formData.emailReminder ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="ml-3 text-gray-700">
                {formData.emailReminder ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (field === "preferredLocations") {
      return (
        <div className="flex flex-col mb-6">
          <div className="flex items-start">
            <label className="font-semibold w-48 text-left mr-6 pt-2 flex-shrink-0">
              {label}
              {mandatory && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={Array.isArray(formData.preferredLocations) ? formData.preferredLocations.join(', ') : formData.preferredLocations}
                  onChange={(e) => {
                    const locations = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    handleInputChange("preferredLocations", locations);
                  }}
                  className="w-full border border-gray-300 rounded px-4 py-2 bg-white"
                  placeholder="Enter locations separated by commas"
                />
              ) : (
                <div className="w-full border border-gray-300 rounded bg-white px-4 py-2">
                  {Array.isArray(formData.preferredLocations) && formData.preferredLocations.length > 0 ? (
                    formData.preferredLocations.join(", ")
                  ) : (
                    <span className="text-gray-400">Not specified</span>
                  )}
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
    }

    if (field === "preferredTiming") {
      return (
        <div className="flex flex-col mb-6">
          <div className="flex items-start">
            <label className="font-semibold w-48 text-left mr-6 pt-2 flex-shrink-0">
              {label}
              {mandatory && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  {timingOptions.map((option) => {
                    const current = Array.isArray(formData.preferredTiming) ? formData.preferredTiming : [];
                    return (
                      <label key={option.value} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={current.includes(option.value)}
                          onChange={() => handleTimingToggle(option.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="w-full border border-gray-300 rounded bg-white px-4 py-2">
                  {Array.isArray(formData.preferredTiming) && formData.preferredTiming.length > 0 ? (
                    formData.preferredTiming
                      .filter(v => v && v.trim().length > 0)
                      .map((v) => timingOptions.find((opt) => opt.value === v)?.label)
                      .filter(Boolean)
                      .join(", ")
                  ) : (
                    <span className="text-gray-400">Not specified</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col mb-6">
        <div className="flex items-start">
          <label className="font-semibold w-48 text-left mr-6 pt-2 flex-shrink-0">
            {label}
            {mandatory && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="flex-1">
            {isEditing ? (
              <input
                type={type}
                value={formData[field as keyof typeof formData] as string}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2 bg-white"
                placeholder=""
              />
            ) : (
              <div className="w-full border border-gray-300 rounded bg-white px-4 py-2">
                {formData[field as keyof typeof formData] || <span className="text-gray-400">Not specified</span>}
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
      {showSuccessPopup && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Profile updated successfully!</span>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                  className="w-full border border-gray-300 rounded px-4 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                  className="w-full border border-gray-300 rounded px-4 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                  className="w-full border border-gray-300 rounded px-4 py-2"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handlePasswordChange}
                className="flex-1 bg-gradient-to-r from-black via-indigo-900 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-gray-900 hover:via-indigo-800 hover:to-blue-600 font-semibold"
              >
                Update Password
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ current: "", new: "", confirm: "" });
                }}
                className="flex-1 bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-10 flex flex-col items-center">
        <div className="bg-gray-100 shadow-lg rounded-lg p-10 w-full max-w-6xl">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              {renderField("Email:", "email", formData.email, false, "email", "", true)}
              {renderField("Year of study:", "yearOfStudy", userData.mapYear, true, "", "", true)}
              {renderField("Education Level:", "eduLevel", userData.mapEdu, false, "", "", true)}
              {renderField("Gender:", "gender", userData.mapGender, false, "", "", true)}
              {renderField("Current course:", "currentCourse", formData.currentCourse, true, "text", "e.g., Computer Science, Information Systems", true)}
              {renderField("Relevant subjects/modules:", "relevantSubjects", formData.relevantSubjects, true, "text", "e.g., SC2006, SC2005, SC2001", false)}
              {renderField("Preferred study location(s):", "preferredLocations", formData.preferredLocations, true, "text", "e.g., NTU, Jurong, Yishun", true)}
              {renderField("School/ Institution:", "school", formData.school, true, "text", "e.g., Nanyang Technological University", false)}
            </div>

            <div className="space-y-2">
              <div className="flex flex-col items-center mb-8">
                <div className="relative">
                  <div className="bg-gradient-to-r from-black via-indigo-900 to-blue-700 rounded-full w-40 h-40 flex items-center justify-center text-white text-6xl font-bold">
                    {userData.username[0].toUpperCase()}
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <div className={`w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${
                      userData.hasWarning ? 'bg-red-500' : 'bg-green-500'
                    }`}>
                      {userData.hasWarning ? (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-4 font-semibold text-2xl">{userData.username}</p>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="text-sm text-blue-600 hover:underline mt-1"
                >
                  Change password
                </button>
                {userData.hasWarning && (
                  <div className="mt-2 text-sm text-red-600 font-semibold">
                    ⚠ Account Warning Active
                  </div>
                )}
              </div>

              {renderField("Email reminders:", "emailReminder", formData.emailReminder, true, "", "", false)}
              {renderField("Preferred study timing:", "preferredTiming", formData.preferredTiming, true, "text", "", true)}
              {renderField("Usual study duration:", "usualStudyPeriod", formData.usualStudyPeriod, true, "text", "e.g., 2–3 hours per day", false)}
              {renderField("Academic grades/ CGPA:", "academicGrades", formData.academicGrades, true, "text", "e.g., 4.20 / 5.00", false)}
            </div>
          </div>

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