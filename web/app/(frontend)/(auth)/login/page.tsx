"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "@/app/(backend)/AccountController/login";

const initial: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initial);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Check if the error is about unverified email
  const isUnverifiedError = state?.error?.includes("verify your email");

  const handleResendVerification = async () => {
    if (!resendEmail.trim()) return;
    
    setResendLoading(true);
    setResendMessage("");
    
    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResendMessage("Verification code has been resent to your email.");
        setShowResendVerification(false);
      } else {
        setResendMessage(result.message || "Failed to resend verification code.");
      }
    } catch (error) {
      setResendMessage("Failed to resend verification code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        {/* Your existing logo and header code remains the same */}
        <div className="absolute top-6 left-6 flex items-center gap-0.5">
          <img src="/logo.png" alt="website Logo" className="w-12 h-12" />
          <span className="text-xl font-bold text-gray-700">UpGrade</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
          <p className="text-gray-600">Welcome back! Please sign in to your account.</p>
        </div>

        <form action={formAction} className="bg-white rounded-lg shadow-sm border p-8">
          {/* Existing error display */}
          {state?.error && !isUnverifiedError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 text-center" aria-live="polite">{state.error}</p>
            </div>
          )}

          {/* NEW: Unverified account message with resend option */}
          {isUnverifiedError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700 text-center mb-3">{state.error}</p>
              
              {!showResendVerification ? (
                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResendVerification(true);
                      // Try to extract email from the form data or use the entered identifier
                      const form = document.querySelector('form');
                      const identifierInput = form?.querySelector('input[name="identifier"]') as HTMLInputElement;
                      if (identifierInput?.value.includes('@')) {
                        setResendEmail(identifierInput.value);
                      }
                    }}
                    className="text-sm bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition-colors"
                  >
                    Resend Verification Code
                  </button>
                  <p className="text-xs text-yellow-700">
                    Or <a href="/verify-email" className="underline font-medium">click here</a> to go to verification page
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-yellow-700">Enter your email to resend the verification code:</p>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="your.email@school.edu.sg"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {resendLoading ? "Sending..." : "Send Code"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResendVerification(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                  {resendMessage && (
                    <p className={`text-xs text-center ${
                      resendMessage.includes("Failed") ? "text-red-600" : "text-green-600"
                    }`}>
                      {resendMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Your existing form fields remain the same */}
          <fieldset className="mb-6">
            <legend className="block text-sm font-medium text-gray-900 mb-2">Sign in as</legend>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="radio" name="as" value="user" defaultChecked className="accent-blue-600" />
                User
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="radio" name="as" value="admin" className="accent-blue-600" />
                Admin
              </label>
            </div>
          </fieldset>

          <div className="mb-6">
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-900 mb-2">
              Username or Email
            </label>
            <input
              id="identifier"
              name="identifier"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-300 text-gray-900"
              placeholder="Enter your username or email"
            />
          </div>

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
            />
          </div>

          <div className="text-right mb-6">
            <a href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>

          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <a href="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Register now
              </a>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}