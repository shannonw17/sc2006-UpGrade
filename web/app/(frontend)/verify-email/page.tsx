"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const initialUserId = searchParams.get('userId');
  const fromRegistration = searchParams.get('fromRegistration') === 'true';
  
  const [verificationCode, setVerificationCode] = useState("");
  const [userId, setUserId] = useState(initialUserId || "");
  const [inputEmail, setInputEmail] = useState(email || "");
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // If we have userId from registration, we don't need to look up
  useEffect(() => {
    if (initialUserId) {
      setUserId(initialUserId);
    }
  }, [initialUserId]);

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || !userId) {
      setVerifyError("Please enter the verification code");
      return;
    }

    setVerifyError("");
    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, code: verificationCode.trim() }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setVerifySuccess(true);
        setVerifyError("");
        // Redirect based on context
        setTimeout(() => {
          if (fromRegistration) {
            window.location.href = "/login?verified=true&fromRegistration=true";
          } else {
            window.location.href = "/login?verified=true";
          }
        }, 2000);
      } else {
        setVerifyError("Invalid or expired code. Please try again.");
      }
    } catch (error) {
      setVerifyError("Invalid or expired code. Please try again.");
    }
  };

  const handleResendCode = async () => {
    let targetEmail = inputEmail;
    
    // If we have userId but no email, try to get email from user data
    if (userId && !targetEmail) {
      try {
        const response = await fetch('/api/find-user-by-id', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });
        
        const result = await response.json();
        if (result.success) {
          targetEmail = result.user.email;
          setInputEmail(targetEmail);
        }
      } catch (error) {
        console.error("Failed to fetch user email:", error);
      }
    }
    
    if (!targetEmail.trim()) {
      setResendMessage("Please enter your email");
      return;
    }
    
    setResendLoading(true);
    setResendMessage("");
    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: targetEmail }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResendMessage("A new verification code has been sent to your email.");
        setVerifyError("");
      } else {
        setResendMessage(result.message || "Failed to resend code. Please try again.");
      }
    } catch (error) {
      setResendMessage("Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleLookupUser = async () => {
    if (!inputEmail.trim()) return;
    
    setResendLoading(true);
    setResendMessage("");
    try {
      const response = await fetch('/api/find-user-by-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: inputEmail }),
      });
      
      const result = await response.json();
      
      if (result.success && result.user) {
        setUserId(result.user.id);
        setResendMessage("User found. You can now request a verification code.");
      } else {
        setResendMessage("No unverified account found with this email.");
      }
    } catch (error) {
      setResendMessage("Error looking up user.");
    } finally {
      setResendLoading(false);
    }
  };

  // Success screen after verification
  if (verifySuccess) {
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
            <p className="text-gray-600 mb-4">
              Your account has been successfully verified and activated.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to login page...
            </p>
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
              : "Enter your email and verification code to activate your account"
            }
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          {/* Show different UI based on whether we have userId */}
          {!userId ? (
            // User needs to look up their account first
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                Your Email
              </label>
              <input
                id="email"
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="your.email@school.edu.sg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-300 text-gray-900"
              />
              <button
                onClick={handleLookupUser}
                disabled={resendLoading || !inputEmail.trim()}
                className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {resendLoading ? "Checking..." : "Find My Account"}
              </button>
            </div>
          ) : (
            // User can enter verification code
            <>
              {fromRegistration && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-600 text-center">
                    Check your email for the 6-digit verification code
                  </p>
                </div>
              )}
              
              <div className="mb-6">
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-900 mb-2">
                  Verification Code
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-300 text-gray-900 text-center text-2xl tracking-widest"
                />
              </div>

              <button
                onClick={handleVerifyCode}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors mb-4"
              >
                Verify Account
              </button>

              <button
                onClick={handleResendCode}
                disabled={resendLoading}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {resendLoading ? "Sending..." : "Resend Code"}
              </button>
            </>
          )}

          {verifyError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 text-center">{verifyError}</p>
            </div>
          )}

          {resendMessage && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-600 text-center">{resendMessage}</p>
            </div>
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