"use client";

import React, { useState } from "react";
import { editProfile } from "@/app/(backend)/ProfileController/editProfile";
import { changePassword } from "@/app/(backend)/AccountController/changePassword";

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


  const STRONG_PWD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{12,}$/;

  function pwChecklist(pwd: string) {
    return {
      len: pwd.length >= 12,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      num: /\d/.test(pwd),
      special: /[^\w\s]/.test(pwd),
    };
  }

  function pwScore(pwd: string) {
    const c = pwChecklist(pwd);
    return (
      Number(c.len) +
      Number(c.upper) +
      Number(c.lower) +
      Number(c.num) +
      Number(c.special)
    );
  }

  const userData = user || defaultUser;

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  

  const [pwdVisible, setPwdVisible] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [capsOn, setCapsOn] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const canSubmitPwd =
    passwordData.current.trim().length > 0 &&
    passwordData.new.trim().length > 0 &&
    passwordData.confirm.trim().length > 0 &&
    STRONG_PWD_RE.test(passwordData.new) &&
    passwordData.new === passwordData.confirm;

  const score = pwScore(passwordData.new);
  const chk = pwChecklist(passwordData.new);



  const parseStringToArray = (str: string | null | undefined): string[] =>
    !str
      ? []
      : str
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

  const [formData, setFormData] = useState(() => {
    const timingArray = parseStringToArray(userData.preferredTiming);
    const locationsArray = parseStringToArray(userData.preferredLocations);
    return {
      email: userData.email,
      yearOfStudy: userData.yearOfStudy,
      gender: userData.gender,
      currentCourse: userData.currentCourse || "",
      relevantSubjects: userData.relevantSubjects || "",
      preferredLocations: locationsArray,
      preferredLocationsText: Array.isArray(locationsArray)
        ? locationsArray.join(", ")
        : userData.preferredLocations,
      school: userData.school || "",
      preferredTiming: timingArray,
      usualStudyPeriod: userData.usualStudyPeriod || "",
      academicGrades: userData.academicGrades || "",
      emailReminder: userData.emailReminder,
    };
  });

  const timingOptions = [
    { value: "morning", label: "Morning (6am-12pm)" },
    { value: "afternoon", label: "Afternoon (12pm-6pm)" },
    { value: "evening", label: "Evening (6pm-12am)" },
    { value: "night", label: "Night (12am-6am)" },
  ];

  const handleInputChange = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleTimingToggle = (value: string) => {
    const current = Array.isArray(formData.preferredTiming)
      ? formData.preferredTiming
      : [];
    handleInputChange(
      "preferredTiming",
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    );
  };

  const handleCancel = () => {
    const timingArray = parseStringToArray(userData.preferredTiming);
    const locationsArray = parseStringToArray(userData.preferredLocations);
    setFormData({
      email: userData.email,
      yearOfStudy: userData.yearOfStudy,
      gender: userData.gender,
      currentCourse: userData.currentCourse || "",
      relevantSubjects: userData.relevantSubjects || "",
      preferredLocations: locationsArray,
      preferredLocationsText: Array.isArray(locationsArray)
        ? locationsArray.join(", ")
        : userData.preferredLocations,
      school: userData.school || "",
      preferredTiming: timingArray,
      usualStudyPeriod: userData.usualStudyPeriod || "",
      academicGrades: userData.academicGrades || "",
      emailReminder: userData.emailReminder,
    });
    setIsEditing(false);
  };

  const handleSave = async () => {

    if (!formData.currentCourse.trim())
      return alert("Current course is required!");
    const cleanedLocations = (formData.preferredLocationsText || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (cleanedLocations.length === 0)
      return alert("Preferred study location(s) is required!");
    if (
      !Array.isArray(formData.preferredTiming) ||
      formData.preferredTiming.length === 0
    )
      return alert("Please select at least one preferred study timing!");

    setSaving(true);
    const res = await editProfile({
      yearOfStudy: formData.yearOfStudy,
      preferredTiming: formData.preferredTiming.filter(Boolean),
      preferredLocations: cleanedLocations,
      currentCourse: formData.currentCourse.trim(),
      relevantSubjects: formData.relevantSubjects.trim() || null,
      school: formData.school.trim() || null,
      academicGrades: formData.academicGrades.trim() || null,
      usualStudyPeriod: formData.usualStudyPeriod.trim() || null,
      emailReminder: formData.emailReminder,
    });
    setSaving(false);

    if (res.success) {
      setIsEditing(false);
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
    } else {
      alert(res.message || "Failed to update profile");
    }
  };

const handlePasswordChange = async () => {
  const current = passwordData.current.trim();
  const newPwd = passwordData.new.trim();
  const confirm = passwordData.confirm.trim();

  if (!current || !newPwd || !confirm) {
    alert("Please fill in all password fields!");
    return;
  }
  if (newPwd !== confirm) {
    alert("New passwords do not match!");
    return;
  }

  if (!STRONG_PWD_RE.test(newPwd)) {
    alert(
      "Password must be at least 12 characters long and include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character."
    );
    return;
  }

  setIsChangingPassword(true);
const result = await changePassword(current, newPwd, confirm);
  setIsChangingPassword(false);

  if (result?.error) {
    alert(result.error);
    return;
  }

  alert("Password changed successfully!");
  setShowPasswordModal(false);
  setPasswordData({ current: "", new: "", confirm: "" });
};

 
  const renderField = (
    label: string,
    field: string,
    value: any,
    editable = true,
    type = "text",
    exampleText = "",
    mandatory = false
  ) => {

    if (!editable) {
      return (
        <div className="flex flex-col mb-6">
          <div className="flex items-start">
            <label className="font-semibold w-48 text-left mr-6 pt-2 flex-shrink-0">
              {label}
            </label>
            <div
              className={`flex-1 border border-gray-300 rounded px-4 py-2 ${
                isEditing ? "bg-gray-200" : "bg-white"
              }`}
            >
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
              {mandatory && isEditing && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            {isEditing ? (
              <select
                value={formData.yearOfStudy}
                onChange={(e) =>
                  handleInputChange("yearOfStudy", e.target.value)
                }
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
            </label>
            <div
              className={`flex-1 border border-gray-300 rounded px-4 py-2 ${
                isEditing ? "bg-gray-200" : "bg-white"
              }`}
            >
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
            </label>
            <div className="flex-1 flex items-center">
              <button
                type="button"
                onClick={() =>
                  isEditing &&
                  handleInputChange("emailReminder", !formData.emailReminder)
                }
                disabled={!isEditing}
                className={`relative inline-flex items-center h-8 rounded-full w-16 transition-colors duration-300 ${
                  formData.emailReminder ? "bg-green-500" : "bg-gray-300"
                } ${!isEditing ? "cursor-default" : "cursor-pointer"}`}
              >
                <span
                  className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-300 shadow-md ${
                    formData.emailReminder ? "translate-x-9" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="ml-3 text-gray-700">
                {formData.emailReminder ? "On" : "Off"}
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
              {mandatory && isEditing && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.preferredLocationsText}
                  onChange={(e) => {
                    const raw = e.target.value;
                    handleInputChange("preferredLocationsText", raw);
                    const arr =
                      raw === ""
                        ? []
                        : raw
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                    handleInputChange("preferredLocations", arr);
                  }}
                  className="w-full border border-gray-300 rounded px-4 py-2 bg-white"
                  placeholder="Enter locations separated by commas"
                />
              ) : (
                <div className="w-full border border-gray-300 rounded bg-white px-4 py-2">
                  {formData.preferredLocationsText?.trim() ? (
                    formData.preferredLocationsText
                  ) : (
                    <span className="text-red-400 font-semibold">
                      Required - Please fill in
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {isEditing &&
            formData.preferredLocations.filter((l) => l.trim().length > 0)
              .length === 0 && (
              <div className="flex mt-1">
                <div className="w-48 mr-6"></div>
                <p className="text-xs text-red-500 font-semibold">
                  * This field is required. Please enter at least one location.
                </p>
              </div>
            )}
        </div>
      );
    }

    if (field === "preferredTiming") {
      const current = Array.isArray(formData.preferredTiming)
        ? formData.preferredTiming
        : [];
      return (
        <div className="flex flex-col mb-6">
          <div className="flex items-start">
            <label className="font-semibold w-48 text-left mr-6 pt-2 flex-shrink-0">
              {label}
              {mandatory && isEditing && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  {timingOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={current.includes(opt.value)}
                        onChange={() => handleTimingToggle(opt.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="w-full border border-gray-300 rounded bg-white px-4 py-2">
                  {current.length > 0 ? (
                    Array.from(new Set(current))
                      .filter(Boolean)
                      .map(
                        (v) => timingOptions.find((o) => o.value === v)?.label
                      )
                      .filter(Boolean)
                      .join(", ")
                  ) : (
                    <span className="text-red-400 font-semibold">
                      Required - Please select
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {isEditing && current.length === 0 && (
            <div className="flex mt-1">
              <div className="w-48 mr-6"></div>
              <p className="text-xs text-red-500 font-semibold">
                * This field is required. Please select at least one timing.
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col mb-6">
        <div className="flex items-start">
          <label className="font-semibold w-48 text-left mr-6 pt-2 flex-shrink-0">
            {label}
            {mandatory && isEditing && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
          <div className="flex-1">
            {isEditing ? (
              <input
                type={type}
                value={(formData as any)[field] as string}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2 bg-white"
              />
            ) : (
              <div className="w-full border border-gray-300 rounded bg-white px-4 py-2">
                {(formData as any)[field] ? (
                  (formData as any)[field]
                ) : mandatory ? (
                  <span className="text-red-400 font-semibold">
                    Required - Please fill in
                  </span>
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
            <p className="text-xs text-gray-500 italic">{exampleText}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      {showSuccessPopup && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-semibold">Profile updated successfully!</span>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Change Password</h2>
            <div className="space-y-5">
              {/* Current password */}
              <div>
                <label className="block font-semibold mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={pwdVisible.current ? "text" : "password"}
                    value={passwordData.current}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        current: e.target.value,
                      })
                    }
                    onKeyUp={(e) =>
                      setCapsOn((p) => ({
                        ...p,
                        current: (e as any).getModifierState?.("CapsLock"),
                      }))
                    }
                    className="w-full border rounded px-4 py-2 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPwdVisible((p) => ({ ...p, current: !p.current }))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                  >
                    {pwdVisible.current ? "Hide" : "Show"}
                  </button>
                </div>
                {capsOn.current && (
                  <p className="mt-1 text-xs text-amber-600">Caps Lock is ON</p>
                )}
              </div>

              {/* New password */}
              <div>
                <label className="block font-semibold mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={pwdVisible.new ? "text" : "password"}
                    value={passwordData.new}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, new: e.target.value })
                    }
                    onKeyUp={(e) =>
                      setCapsOn((p) => ({
                        ...p,
                        new: (e as any).getModifierState?.("CapsLock"),
                      }))
                    }
                    className="w-full border rounded px-4 py-2 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPwdVisible((p) => ({ ...p, new: !p.new }))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                  >
                    {pwdVisible.new ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Strength bar */}
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-gray-200 rounded">
                    <div
                      className="h-1.5 rounded transition-all"
                      style={{
                        width: `${(score / 5) * 100}%`,
                        background:
                          score <= 2
                            ? "#ef4444"
                            : score === 3
                            ? "#f59e0b"
                            : "#22c55e",
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {score <= 2 ? "Weak" : score === 3 ? "Medium" : "Strong"}
                  </p>
                </div>

                {/* Requirements checklist */}
                <ul className="mt-2 space-y-1 text-sm">
                  <li
                    className={`flex items-center gap-2 ${
                      chk.len ? "text-green-600" : "text-gray-600"
                    }`}
                  >
                    <span className="inline-block w-4">
                      {chk.len ? "✓" : "•"}
                    </span>
                    At least 12 characters
                  </li>
                  <li
                    className={`flex items-center gap-2 ${
                      chk.upper ? "text-green-600" : "text-gray-600"
                    }`}
                  >
                    <span className="inline-block w-4">
                      {chk.upper ? "✓" : "•"}
                    </span>
                    Contains an uppercase letter (A–Z)
                  </li>
                  <li
                    className={`flex items-center gap-2 ${
                      chk.lower ? "text-green-600" : "text-gray-600"
                    }`}
                  >
                    <span className="inline-block w-4">
                      {chk.lower ? "✓" : "•"}
                    </span>
                    Contains a lowercase letter (a–z)
                  </li>
                  <li
                    className={`flex items-center gap-2 ${
                      chk.num ? "text-green-600" : "text-gray-600"
                    }`}
                  >
                    <span className="inline-block w-4">
                      {chk.num ? "✓" : "•"}
                    </span>
                    Contains a number (0–9)
                  </li>
                  <li
                    className={`flex items-center gap-2 ${
                      chk.special ? "text-green-600" : "text-gray-600"
                    }`}
                  >
                    <span className="inline-block w-4">
                      {chk.special ? "✓" : "•"}
                    </span>
                    Contains a special character (!@#$…)
                  </li>
                </ul>

                {capsOn.new && (
                  <p className="mt-1 text-xs text-amber-600">Caps Lock is ON</p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block font-semibold mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={pwdVisible.confirm ? "text" : "password"}
                    value={passwordData.confirm}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirm: e.target.value,
                      })
                    }
                    onKeyUp={(e) =>
                      setCapsOn((p) => ({
                        ...p,
                        confirm: (e as any).getModifierState?.("CapsLock"),
                      }))
                    }
                    className="w-full border rounded px-4 py-2 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPwdVisible((p) => ({ ...p, confirm: !p.confirm }))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                  >
                    {pwdVisible.confirm ? "Hide" : "Show"}
                  </button>
                </div>
                {passwordData.confirm &&
                  passwordData.new !== passwordData.confirm && (
                    <p className="mt-1 text-xs text-red-600">
                      Passwords do not match
                    </p>
                  )}
                {capsOn.confirm && (
                  <p className="mt-1 text-xs text-amber-600">Caps Lock is ON</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded border"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={!canSubmitPwd || isChangingPassword}
                  className={`px-4 py-2 rounded text-white ${
                    !canSubmitPwd || isChangingPassword
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-black hover:bg-gray-800"
                  }`}
                >
                  {isChangingPassword ? "Updating…" : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-10 flex flex-col items-center">
        <div className="bg-gray-100 shadow-lg rounded-lg p-10 w-full max-w-6xl opacity-100">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              {renderField("Email:", "email", formData.email, false, "email")}
              {renderField(
                "Year of study:",
                "yearOfStudy",
                userData.mapYear,
                true,
                "",
                "",
                true
              )}
              {renderField(
                "Education Level:",
                "eduLevel",
                userData.mapEdu,
                false
              )}
              {renderField("Gender:", "gender", userData.mapGender, false)}
              {renderField(
                "Current course:",
                "currentCourse",
                formData.currentCourse,
                true,
                "text",
                "e.g., Computer Science, Information Systems",
                true
              )}
              {renderField(
                "Relevant subjects/modules:",
                "relevantSubjects",
                formData.relevantSubjects,
                true,
                "text",
                "e.g., SC2006, SC2005, SC2001"
              )}
              {renderField(
                "Preferred study location(s):",
                "preferredLocations",
                formData.preferredLocations,
                true,
                "text",
                "e.g., NTU, Jurong, Yishun",
                true
              )}
              {renderField(
                "School/ Institution:",
                "school",
                formData.school,
                true,
                "text",
                "e.g., Nanyang Technological University"
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-col items-center mb-8">
                <div className="relative">
                  <div className="bg-gradient-to-r from-black via-indigo-900 to-blue-700 rounded-full w-40 h-40 flex items-center justify-center text-white text-6xl font-bold">
                    {userData.username[0].toUpperCase()}
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <div
                      className={`w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${
                        userData.hasWarning ? "bg-red-500" : "bg-green-500"
                      }`}
                    >
                      {userData.hasWarning ? (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-4 font-semibold text-2xl">
                  {userData.username}
                </p>
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

              {renderField(
                "Email reminders:",
                "emailReminder",
                formData.emailReminder,
                true
              )}
              {renderField(
                "Preferred study timing:",
                "preferredTiming",
                formData.preferredTiming,
                true,
                "text",
                "",
                true
              )}
              {renderField(
                "Usual study duration:",
                "usualStudyPeriod",
                formData.usualStudyPeriod,
                true,
                "text",
                "e.g., 2–3 hours per day"
              )}
              {renderField(
                "Academic grades/ CGPA:",
                "academicGrades",
                formData.academicGrades,
                true,
                "text",
                "e.g., 4.20 / 5.00"
              )}
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-10">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-black via-indigo-900 to-blue-700 text-white px-12 py-3 rounded-lg hover:from-gray-900 hover:via-indigo-800 hover:to-blue-600 font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
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
