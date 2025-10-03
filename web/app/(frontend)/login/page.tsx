// app/(auth)/login/LoginForm.tsx
"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/(backend)/AccountController/login";

const initial: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initial);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        {/* logo on the top left */}
        <div className="absolute top-6 left-6 flex items-center gap-0.5">
          <img 
            src="/logo.png" 
            alt="website Logo" 
            className="w-12 h-12"  
          />
          <span className="text-xl font-bold text-gray-700">UpGrade</span>
        </div>
        
        {/* centered header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
          <p className="text-gray-600">Welcome back! Please sign in to your account.</p>
        </div>

        {/* Form Card */}
        <form action={formAction} className="bg-white rounded-lg shadow-sm border p-8">
          {/* Error Message */}
          {state?.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 text-center" aria-live="polite">{state.error}</p>
            </div>
          )}

          {/* Username/Email Field */}
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

          {/* Password Field */}
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

          {/* Forgot Password Link */}
          <div className="text-right mb-6">
            <a href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Forgot password?
            </a>
          </div>

          {/* Login Button */}
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

          {/* Register Link */}
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