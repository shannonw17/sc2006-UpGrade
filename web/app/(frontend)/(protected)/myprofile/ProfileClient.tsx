"use client";

import React, { useState } from "react";

export default function ProfileClient({ user }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(user.yearOfStudy);

  const handleSave = async () => {
    // Placeholder: add an API route later to update the user
    console.log("Saving year:", selectedYear);
    setIsEditing(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 p-10 flex flex-col items-center">
        <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-4xl">
          <div className="flex justify-between items-start">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Email:</p>
                <p>{user.email}</p>
              </div>
              <div>
                <p className="font-semibold">Year of study:</p>
                {isEditing ? (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="border border-gray-300 rounded-lg p-2 w-full"
                  >
                    {user.yearOptions.map((opt: any) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p>{user.mapYear}</p>
                )}
              </div>
              <div>
                <p className="font-semibold">Education Level:</p>
                <p>{user.mapEdu}</p>
              </div>
              <div>
                <p className="font-semibold">Gender:</p>
                <p>{user.mapGender}</p>
              </div>
              <div>
                <p className="font-semibold">Current course:</p>
                <p>{user.school || "Computer Science"}</p>
              </div>
              <div>
                <p className="font-semibold">Preferred study timing:</p>
                <p>{user.preferredTiming}</p>
              </div>
              <div>
                <p className="font-semibold">Usual study duration:</p>
                <p>{user.usualStudyPeriod || "3–4 hours"}</p>
              </div>
              <div>
                <p className="font-semibold">Email reminders:</p>
                <p>{user.emailReminder ? "On" : "Off"}</p>
              </div>
            </div>

            <div className="flex flex-col items-center ml-10">
              <div className="bg-gradient-to-b from-indigo-900 to-blue-700 rounded-full w-24 h-24 flex items-center justify-center text-white text-4xl font-bold">
                {user.username[0].toUpperCase()}
              </div>
              <p className="mt-3 font-semibold text-lg">{user.username}</p>
              <a href="#" className="text-sm text-indigo-600 hover:underline">
                Change password
              </a>
            </div>
          </div>

          <div className="flex justify-between mt-10">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Edit profile
                </button>
                <button className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">
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
