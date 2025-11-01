// app/(frontend)/verify-email/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import {
  resendVerificationAction,
  type ResendVerificationState,
  verifyCodeAction,
  type VerifyCodeState,
  findUserByEmailAction,
  type FindUserByEmailState,
} from "@/app/(backend)/AccountController/verifyEmail";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get("email") ?? "";
  const queryUserId = searchParams.get("userId") ?? "";
  const fromRegistration = searchParams.get("fromRegistration") === "true";

  //server-action state machines
  const [findState, findAction, findPending] = useActionState<FindUserByEmailState, FormData>(
    findUserByEmailAction,
    {}
  );
  const [resendState, resendAction, resendPending] = useActionState<ResendVerificationState, FormData>(
    resendVerificationAction,
    {}
  );
  const [verifyState, verifyAction, verifyPending] = useActionState<VerifyCodeState, FormData>(
    verifyCodeAction,
    {}
  );

  const [emailInput, setEmailInput] = useState(queryEmail);
  const [code, setCode] = useState("");
  const [userId, setUserId] = useState(queryUserId);

  // whenever findState returns a userId, adopt it
  useEffect(() => {
    if (findState?.ok && findState.userId) {
      setUserId(findState.userId);
      if (findState.normalizedEmail) setEmailInput(findState.normalizedEmail);
    }
  }, [findState]);

  // success behavior: when verify ok, redirect after a short pause
  useEffect(() => {
    if (verifyState?.ok) {
      const to = fromRegistration
        ? "/login?verified=true&fromRegistration=true"
        : "/login?verified=true";
      const t = setTimeout(() => (window.location.href = to), 1600);
      return () => clearTimeout(t);
    }
  }, [verifyState?.ok, fromRegistration]);

  const canVerify = useMemo(() => userId && code.trim().length === 6, [userId, code]);

  //success screen after verification
  if (verifyState?.ok) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md">
          <div className="absolute top-6 left-6 flex items-center gap-0.5">
            <img src="/logo.png" alt="website Logo" className="w-12 h-12" />
            <span className="text-xl font-bold text-gray-700">UpGrade</span>
          </div>

          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Activated!</h1>
            <p className="text-gray-600 mb-4">Your account has been successfully verified and activated.</p>
            <p className="text-sm text-gray-500">Redirecting to login page…</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="absolute top-6 left-6 flex items-center gap-0.5">
          <img src="/logo.png" alt="website Logo" className="w-12 h-12" />
          <span className="text-xl font-bold text-gray-700">UpGrade</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {fromRegistration ? "Verify Your Email" : "Activate Your Account"}
          </h1>
          <p className="text-gray-600">
            {fromRegistration
              ? "We've sent a 6-digit verification code to your email address."
              : "Enter your email and verification code to activate your account"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          {/* lookup account if we don't have a userId yet */}
          {!userId ? (
            <form action={findAction} className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                Your Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="your.email@school.edu.sg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-300 text-gray-900"
                required
              />
              <button
                type="submit"
                disabled={findPending || !emailInput.trim()}
                className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {findPending ? "Checking…" : "Find My Account"}
              </button>

              {/* message from find */}
              {findState?.message && (
                <div
                  className={`mt-4 p-3 rounded-md border ${
                    findState.ok
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-600"
                  }`}
                >
                  <p className="text-sm text-center">{findState.message}</p>
                </div>
              )}
            </form>
          ) : (
            <>
              {/* verify code */}
              {fromRegistration && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-600 text-center">
                    Check your email for the 6-digit verification code.
                  </p>
                </div>
              )}

              {/* verify form */}
              <form action={verifyAction} className="mb-3">
                {/* carry userId to the server action */}
                <input type="hidden" name="userId" value={userId} />

                <div className="mb-6">
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-900 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="verificationCode"
                    name="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    className={`w-full px-4 py-3 border ${
                      verifyState?.ok === false
                        ? "border-red-400 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    } rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors placeholder-gray-300 text-gray-900 text-center text-2xl tracking-widest`}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifyPending || !canVerify}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                >
                  {verifyPending ? "Verifying…" : "Verify Account"}
                </button>

                {/* show verification error message */}
                {verifyState?.message && !verifyState.ok && (
                  <div className="mt-4 p-3 rounded-md border bg-red-50 border-red-200 text-red-600 text-center text-sm">
                    {verifyState.message || "Invalid or expired verification code."}
                  </div>
                )}
              </form>

              {/* resend code */}
              <form action={resendAction} className="w-full">
                <input type="hidden" name="email" value={emailInput} />
                <input type="hidden" name="userId" value={userId} />
                <button
                  type="submit"
                  disabled={resendPending || !(emailInput.trim() || userId)}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors disabled:opacity-50"
                >
                  {resendPending ? "Sending…" : "Resend Code"}
                </button>
                {resendState?.message && (
                  <div
                    className={`mt-3 p-3 rounded-md border text-sm text-center ${
                      resendState.ok
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-600"
                    }`}
                  >
                    {resendState.message}
                  </div>
                )}
              </form>
            </>
          )}

          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {fromRegistration ? "Wrong email?" : "Remember your password?"}{" "}
              {fromRegistration ? (
                <a href="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Start over
                </a>
              ) : (
                <a href="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Back to login
                </a>
              )}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
