"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { sendResetCode, resetPassword, validateResetCode } from "@/app/(backend)/AccountController/forgotPassword";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "verify" | "reset">("email");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1 — Send reset code
  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await sendResetCode(username, email);
      setUserId(result.userId);
      setStep("verify");
      console.log("Reset code sent to email:", result.code);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Validate reset code before proceeding
  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!resetCode.trim()) {
      setError("Please enter your reset code");
      return;
    }

    setLoading(true);
    try {
      // Validate the code before proceeding to password reset
      const isValid = await validateResetCode(userId, resetCode.trim());
      if (isValid) {
        setStep("reset");
      } else {
        setError("Invalid or expired reset code. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Invalid reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — Reset password
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(userId, resetCode, newPassword, confirmPassword);
      alert("Password reset successfully! You can now login with your new password.");
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ------------------- UI -------------------

  if (step === "verify") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md">
          <div className="absolute top-6 left-6 flex items-center gap-0.5">
            <img src="/logo.png" alt="UpGrade Logo" className="w-12 h-12" />
            <span className="text-xl font-bold text-gray-700">UpGrade</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Enter Reset Code</h1>
            <p className="text-gray-600">We've sent a 6-digit code to {email}</p>
          </div>

          <form onSubmit={handleVerifyCode} className="bg-white rounded-lg shadow-sm border p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <input
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              maxLength={6}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500"
              placeholder="000000"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Back to email entry
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  if (step === "reset") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md">
          <div className="absolute top-6 left-6 flex items-center gap-0.5">
            <img src="/logo.png" alt="UpGrade Logo" className="w-12 h-12" />
            <span className="text-xl font-bold text-gray-700">UpGrade</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
            <p className="text-gray-600">Enter your new password</p>
          </div>

          <form onSubmit={handleResetPassword} className="bg-white rounded-lg shadow-sm border p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Min 12 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setStep("verify")}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Back to code entry
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // Step 1: Email and Username form
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="absolute top-6 left-6 flex items-center gap-0.5">
          <img src="/logo.png" alt="UpGrade Logo" className="w-12 h-12" />
          <span className="text-xl font-bold text-gray-700">UpGrade</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h1>
          <p className="text-gray-600">Enter your username and email to receive a reset code</p>
        </div>

        <form onSubmit={handleSendCode} className="bg-white rounded-lg shadow-sm border p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 mb-4"
          >
            {loading ? "Sending Code..." : "Send Reset Code"}
          </button>

          <a
            href="/login"
            className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Back to Login
          </a>
        </form>
      </div>
    </main>
  );
}