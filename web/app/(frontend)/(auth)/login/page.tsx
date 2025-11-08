// app/(frontend)/(auth)/login/page.tsx
"use client";

import { useActionState, useEffect, useState } from "react";
import { login, type LoginState } from "@/app/(backend)/AccountController/login";
import {
  resendVerificationAction,
  type ResendVerificationState,
} from "@/app/(backend)/AccountController/verifyEmail";

const initialLogin: LoginState = {};
const initialResend: ResendVerificationState = {};

export default function LoginForm() {
  const [loginState, loginAction, loginPending] = useActionState(login, initialLogin);
  const [resendState, resendAction, resendPending] = useActionState(
    resendVerificationAction,
    initialResend
  );

  const [selectedRole, setSelectedRole] = useState<"user" | "admin">("user");
  const [resendEmail, setResendEmail] = useState("");
  
  const isUnverifiedError =
    !!loginState?.error && loginState.error.toLowerCase().includes("verify your email");

  //prefill email for resend
  const presetEmail =
    resendState?.presetEmail ||
    (loginState?.identifier && loginState.identifier.includes("@")
      ? loginState.identifier
      : "");

  useEffect(() => {
    if (isUnverifiedError) {
      setResendEmail(presetEmail);
    }
  }, [isUnverifiedError, presetEmail]);

  const handleRoleChange = (role: "user" | "admin") => {
    setSelectedRole(role);
  };

  const closeVerificationModal = () => {
    //reset the login state to hide the modal
    window.location.reload();
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <img src="/logo.png" alt="UpGrade Logo" className="w-12 h-12" />
          <span className="text-xl font-bold text-gray-700">UpGrade</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
          <p className="text-gray-600">Welcome back! Please sign in to your account.</p>
        </div>

        {/* Unverified Account Modal */}
        {isUnverifiedError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md">
              {/* Close Button */}
              <div className="flex justify-end p-4 pb-0">
                <button
                  onClick={closeVerificationModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 pt-4">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Account Not Verified</h2>
                  <p className="text-gray-600 text-sm">{loginState.error}</p>
                </div>

                {/* Resend Verification Form */}
                <form action={resendAction} className="space-y-4">
                  <div>
                    <label htmlFor="resend-email" className="block text-sm font-medium text-gray-700 mb-2">
                      Enter your email to resend verification code
                    </label>
                    <input
                      id="resend-email"
                      type="email"
                      name="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="your.email@school.edu.sg"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      required
                    />
                  </div>

                  {/* Action Button */}
                  <button
                    type="submit"
                    disabled={resendPending}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {resendPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      "Send Verification Code"
                    )}
                  </button>
                </form>

                {/* Success/Error Messages */}
                {resendState?.message && (
                  <div className={`mt-4 p-3 rounded-lg text-center ${
                    resendState.ok 
                      ? "bg-green-50 text-green-700 border border-green-200" 
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    <p className="text-sm font-medium">{resendState.message}</p>
                  </div>
                )}

                {/* Alternative Options */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600 text-center mb-3">
                    Need help with verification?
                  </p>
                  <div className="flex justify-center">
                    <a 
                      href="/verify-email" 
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Go to Verification Page
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Login Form */}
        <form action={loginAction} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Generic errors */}
          {loginState?.error && !isUnverifiedError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-600" aria-live="polite">
                  {loginState.error}
                </p>
              </div>
            </div>
          )}

          {/* Role selector */}
          <fieldset className="mb-6">
            <legend className="block text-sm font-medium text-gray-900 mb-2">Sign in as</legend>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input 
                  type="radio" 
                  name="as" 
                  value="user" 
                  checked={selectedRole === "user"}
                  onChange={() => handleRoleChange("user")}
                  className="accent-blue-600" 
                />
                User
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input 
                  type="radio" 
                  name="as" 
                  value="admin" 
                  checked={selectedRole === "admin"}
                  onChange={() => handleRoleChange("admin")}
                  className="accent-blue-600" 
                />
                Admin
              </label>
            </div>
          </fieldset>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-900 mb-2">
                Username or Email
              </label>
              <input
                id="identifier"
                name="identifier"
                required
                defaultValue={loginState?.identifier ?? ""}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 text-gray-900"
                placeholder="Enter your username or email"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 text-gray-900"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right mt-4 mb-6">
            <a href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loginPending}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {loginPending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>

          {/* Register Link */}
          {selectedRole === "user" && (
            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <a href="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Register now
                </a>
              </p>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}