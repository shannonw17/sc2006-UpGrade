"use client";

import { useActionState, useState, useEffect } from "react";
import { createProfile } from "@/app/(backend)/ProfileController/createProfile";

type RegisterState = {
  success?: boolean;
  message?: string;
  userId?: string;
  needsVerification?: boolean;
};

const initial: RegisterState = {};

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(async (prevState: RegisterState, formData: FormData) => {
    const result = await createProfile(formData);
    return result as RegisterState;
  }, initial);

  const [eduLevel, setEduLevel] = useState("UNI");
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [email, setEmail] = useState("");
  const [emailValid, setEmailValid] = useState(true);
  const [emailTouched, setEmailTouched] = useState(false);
  
  // Password validation states
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });

  const yearOptions = {
    SEC: [
      { value: "S1", label: "Sec 1" },
      { value: "S2", label: "Sec 2" },
      { value: "S3", label: "Sec 3" },
      { value: "S4", label: "Sec 4" },
      { value: "S5", label: "Sec 5" },
    ],
    JC: [
      { value: "J1", label: "Year 1" },
      { value: "J2", label: "Year 2" },
    ],
    POLY: [
      { value: "P1", label: "Poly 1" },
      { value: "P2", label: "Poly 2" },
      { value: "P3", label: "Poly 3" },
    ],
    UNI: [
      { value: "U1", label: "Year 1" },
      { value: "U2", label: "Year 2" },
      { value: "U3", label: "Year 3" },
      { value: "U4", label: "Year 4" },
    ],
  };

  useEffect(() => {
    if (state?.success && state?.userId) {
 
      window.location.href = `/verify-email?userId=${state.userId}&email=${encodeURIComponent(email)}&fromRegistration=true`;
    }
  }, [state, email]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    setPasswordRequirements({
      minLength: newPassword.length >= 12,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
    });
    
    if (confirmPassword) {
      setPasswordMatch(newPassword === confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    setPasswordMatch(password === newConfirmPassword);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setEmailTouched(true);
    
    const isValid = newEmail.toLowerCase().endsWith('.edu.sg');
    setEmailValid(isValid);
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    const isValid = email.toLowerCase().endsWith('.edu.sg');
    setEmailValid(isValid);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!emailValid) {
      e.preventDefault();
      return;
    }
   
  };


  const canSubmit = emailValid && passwordMatch && 
    passwordRequirements.minLength && 
    passwordRequirements.hasUppercase &&
    passwordRequirements.hasLowercase &&
    passwordRequirements.hasNumber &&
    passwordRequirements.hasSpecial;


  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-2xl">
        <div className="absolute top-6 left-6 flex items-center gap-0.5">
          <img src="/logo.png" alt="website Logo" className="w-12 h-12" />
          <span className="text-xl font-bold text-gray-700">UpGrade</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join our student collaboration platform</p>
        </div>

        <form action={formAction} onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-8">
          {state?.message && !state?.success && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 text-center" aria-live="polite">{state.message}</p>
            </div>
          )}

          {state?.success && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-600 text-center">
                Account created! Redirecting to verification...
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-900 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                name="username"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-300 text-gray-900"
                placeholder="Choose a unique username"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                School Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors placeholder-gray-300 text-gray-900 ${
                  emailTouched && !emailValid
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
                }`}
                placeholder="your.email@school.edu.sg"
              />
              {emailTouched && !emailValid ? (
                <p className="text-xs text-red-600 mt-1">Email must end with .edu.sg</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Must end with .edu.sg</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={12}
                value={password}
                onChange={handlePasswordChange}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-300 text-gray-900"
                placeholder="Min. 12 characters"
              />
              
              {/* Password Requirements Popup */}
              {(passwordFocused || password) && (
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1">
                  <p className="font-medium text-gray-700 mb-2">Password must contain:</p>
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 ${passwordRequirements.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.minLength ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span>At least 12 characters</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordRequirements.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.hasUppercase ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span>One uppercase letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordRequirements.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.hasLowercase ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span>One lowercase letter (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.hasNumber ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span>One number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordRequirements.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.hasSpecial ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span>One special character (!@#$%^&*)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={12}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors placeholder-gray-300 text-gray-900 ${
                  confirmPassword && !passwordMatch
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="Re-enter password"
              />
              {confirmPassword && !passwordMatch && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Education Level */}
            <div>
              <label htmlFor="eduLevel" className="block text-sm font-medium text-gray-900 mb-2">
                Education Level <span className="text-red-500">*</span>
              </label>
              <select
                id="eduLevel"
                name="eduLevel"
                required
                value={eduLevel}
                onChange={(e) => setEduLevel(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 bg-white"
              >
                <option value="SEC">Secondary</option>
                <option value="JC">Junior College</option>
                <option value="POLY">Polytechnic</option>
                <option value="UNI">University</option>
              </select>
            </div>

            {/* Year of Study */}
            <div>
              <label htmlFor="yearOfStudy" className="block text-sm font-medium text-gray-900 mb-2">
                Year of Study <span className="text-red-500">*</span>
              </label>
              <select
                id="yearOfStudy"
                name="yearOfStudy"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 bg-white"
              >
                {yearOptions[eduLevel as keyof typeof yearOptions].map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="MALE"
                    required
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-900">Male</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="FEMALE"
                    required
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-900">Female</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="OTHER"
                    required
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-900">Other</span>
                </label>
              </div>
            </div>

            {/* Preferred Timing */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Preferred Study Timing <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="preferredTiming"
                    value="Morning"
                    className="accent-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-900">Morning (6am-12pm)</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="preferredTiming"
                    value="Afternoon"
                    className="accent-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-900">Afternoon (12pm-6pm)</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="preferredTiming"
                    value="Evening"
                    className="accent-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-900">Evening (6pm-12am)</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="preferredTiming"
                    value="Night"
                    className="accent-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-900">Night (12am-6am)</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">Select at least one</p>
            </div>

            {/* Preferred Locations */}
            <div className="md:col-span-2">
              <label htmlFor="preferredLocations" className="block text-sm font-medium text-gray-900 mb-2">
                Preferred Study Locations <span className="text-red-500">*</span>
              </label>
              <input
                id="preferredLocations"
                name="preferredLocations"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-300 text-gray-900"
                placeholder="e.g., Woodlands, Jurong East, NTU Library"
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple locations with commas</p>
            </div>

            {/* Current Course */}
            <div>
              <label htmlFor="currentCourse" className="block text-sm font-medium text-gray-900 mb-2">
                Current Course/Program <span className="text-red-500">*</span>
              </label>
              <input
                id="currentCourse"
                name="currentCourse"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-300 text-gray-900"
                placeholder="e.g., Computer Science"
              />
            </div>

            {/* School/Institution */}
            <div>
              <label htmlFor="school" className="block text-sm font-medium text-gray-900 mb-2">
                School/Institution <span className="text-red-500">*</span>
              </label>
              <input
                id="school"
                name="school"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-300 text-gray-900"
                placeholder="e.g., Nanyang Technological University"
              />
            </div>

            {/* Relevant Subjects */}
            <div className="md:col-span-2">
              <label htmlFor="relevantSubjects" className="block text-sm font-medium text-gray-700 mb-2">
                Relevant Subjects/Modules (Optional)
              </label>
              <input
                id="relevantSubjects"
                name="relevantSubjects"
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-300 text-gray-900"
                placeholder="e.g., SC2006, SC2005, Mathematics"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending || !canSubmit}
            className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>

          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}