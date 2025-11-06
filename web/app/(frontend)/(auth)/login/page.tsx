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

  //resend verification (server action)
  const [resendState, resendAction, resendPending] = useActionState(
    resendVerificationAction,
    initialResend
  );

  const [showResend, setShowResend] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"user" | "admin">("user");
  
  const isUnverifiedError =
    !!loginState?.error && loginState.error.toLowerCase().includes("verify your email");

  //prefill the email for resend, from either the login state or last successful resend
  const presetEmail =
    resendState?.presetEmail ||
    (loginState?.identifier && loginState.identifier.includes("@")
      ? loginState.identifier
      : "");

  useEffect(() => {
    if (isUnverifiedError) setShowResend(true);
  }, [isUnverifiedError]);

  const handleRoleChange = (role: "user" | "admin") => {
    setSelectedRole(role);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <img src="/logo.png" alt="UpGrade Logo" className="w-12 h-12" />
          <span className="text-xl font-bold text-gray-700">UpGrade</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
          <p className="text-gray-600">Welcome back! Please sign in to your account.</p>
        </div>

        {/* LOGIN via server action */}
        <form action={loginAction} className="bg-white rounded-lg shadow-sm border p-8">
          {/* Generic errors (not unverified) */}
          {loginState?.error && !isUnverifiedError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 text-center" aria-live="polite">
                {loginState.error}
              </p>
            </div>
          )}

          {/* Unverified account block + resend (server action) */}
          {isUnverifiedError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700 text-center mb-3">{loginState.error}</p>

              {!showResend ? (
                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowResend(true)}
                    className="text-sm bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition-colors"
                  >
                    Resend Verification Code
                  </button>
                  <p className="text-xs text-yellow-700">
                    Or{" "}
                    <a href="/verify-email" className="underline font-medium">
                      click here
                    </a>{" "}
                    to go to verification page
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-yellow-700">Enter your email to resend the verification code:</p>

                  {/* Server action form for resending */}
                  <form action={resendAction} className="space-y-3">
                    <input
                      type="email"
                      name="email"
                      defaultValue={presetEmail}
                      placeholder="your.email@school.edu.sg"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={resendPending}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {resendPending ? "Sending..." : "Send Code"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResend(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>

                    {resendState?.message && (
                      <p
                        className={`text-xs text-center ${
                          resendState.ok ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {resendState.message}
                      </p>
                    )}
                  </form>
                </div>
              )}
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

          {/* Identifier */}
          <div className="mb-6">
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-900 mb-2">
              Username or Email
            </label>
            <input
              id="identifier"
              name="identifier"
              required
              defaultValue={loginState?.identifier ?? ""}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-300 text-gray-900"
              placeholder="Enter your username or email"
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-300 text-gray-900"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <div className="text-right mb-6">
            <a href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loginPending}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loginPending ? "Signing in..." : "Sign in"}
          </button>

          {/* Only show register link for user role */}
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