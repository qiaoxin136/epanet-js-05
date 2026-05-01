"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Amplify } from "aws-amplify";
import {
  getCurrentUser,
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
} from "aws-amplify/auth";
import { amplifyConfig } from "src/lib/amplify-config";

Amplify.configure(amplifyConfig, { ssr: true });

type Screen =
  | "sign-in"
  | "sign-up"
  | "confirm-sign-up"
  | "forgot-password"
  | "confirm-reset"
  | "checking";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500";
const labelClass =
  "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 text-center";
const primaryBtnClass =
  "w-1/2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const linkBtnClass =
  "text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium cursor-pointer";
const errorClass =
  "rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";

export const LoginForm = () => {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("checking");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  // Sign-in fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign-up fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  // Confirm code
  const [confirmCode, setConfirmCode] = useState("");

  // Forgot / reset
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // If already logged in, go straight to the app
  useEffect(() => {
    getCurrentUser()
      .then(() => router.replace("/"))
      .catch(() => setScreen("sign-in"));
  }, [router]);

  const clearError = () => setError("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      const result = await signIn({ username: email, password });
      if (result.isSignedIn) {
        router.replace("/");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      const result = await signUp({
        username: signUpEmail,
        password: signUpPassword,
        options: {
          userAttributes: {
            email: signUpEmail,
            given_name: firstName,
            family_name: lastName,
          },
        },
      });
      if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setPendingEmail(signUpEmail);
        setScreen("confirm-sign-up");
      } else if (result.isSignUpComplete) {
        await signIn({ username: signUpEmail, password: signUpPassword });
        router.replace("/");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      await confirmSignUp({
        username: pendingEmail,
        confirmationCode: confirmCode,
      });
      await signIn({ username: pendingEmail, password: signUpPassword });
      router.replace("/");
    } catch (err: unknown) {
      setError((err as Error).message || "Confirmation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    clearError();
    try {
      await resendSignUpCode({ username: pendingEmail });
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to resend code.");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      await resetPassword({ username: resetEmail });
      setPendingEmail(resetEmail);
      setScreen("confirm-reset");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      await confirmResetPassword({
        username: pendingEmail,
        confirmationCode: resetCode,
        newPassword,
      });
      // Pre-fill sign-in and go back
      setEmail(pendingEmail);
      setPassword(newPassword);
      setScreen("sign-in");
    } catch (err: unknown) {
      setError((err as Error).message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  // Loading / already-authenticated check
  if (screen === "checking") {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 p-8 text-center">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {screen === "sign-in" && "Welcome back"}
          {screen === "sign-up" && "Create your account"}
          {screen === "confirm-sign-up" && "Verify your email"}
          {screen === "forgot-password" && "Reset your password"}
          {screen === "confirm-reset" && "Set a new password"}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {screen === "sign-up" && "Start modeling water networks in your browser"}
          {screen === "confirm-sign-up" &&
            `We sent a code to ${pendingEmail}`}
          {screen === "forgot-password" &&
            "Enter your email and we'll send a reset code"}
          {screen === "confirm-reset" &&
            "Enter the code we sent and choose a new password"}
        </p>
      </div>

      {error && <p className={`${errorClass} mb-5`}>{error}</p>}

      {/* ─── Sign in ─── */}
      {screen === "sign-in" && (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <div className="flex justify-center mt-1.5">
              <button
                type="button"
                className={linkBtnClass}
                onClick={() => {
                  setResetEmail(email);
                  setScreen("forgot-password");
                  clearError();
                }}
              >
                Forgot password?
              </button>
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className={primaryBtnClass}
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-1">
            No account?{" "}
            <button
              type="button"
              className={linkBtnClass}
              onClick={() => {
                setScreen("sign-up");
                clearError();
              }}
            >
              Sign up for free
            </button>
          </p>
        </form>
      )}

      {/* ─── Sign up ─── */}
      {screen === "sign-up" && (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First name</label>
              <input
                type="text"
                className={inputClass}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                autoFocus
              />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input
                type="text"
                className={inputClass}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              className={inputClass}
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              className={inputClass}
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            className={primaryBtnClass}
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-1">
            Already have an account?{" "}
            <button
              type="button"
              className={linkBtnClass}
              onClick={() => {
                setScreen("sign-in");
                clearError();
              }}
            >
              Sign in
            </button>
          </p>
        </form>
      )}

      {/* ─── Confirm sign-up ─── */}
      {screen === "confirm-sign-up" && (
        <form onSubmit={handleConfirmSignUp} className="space-y-4">
          <div>
            <label className={labelClass}>Confirmation code</label>
            <input
              type="text"
              className={inputClass}
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              placeholder="123456"
              required
              autoFocus
              inputMode="numeric"
            />
          </div>
          <button
            type="submit"
            className={primaryBtnClass}
            disabled={loading}
          >
            {loading ? "Verifying…" : "Verify email"}
          </button>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Didn't receive the code?{" "}
            <button
              type="button"
              className={linkBtnClass}
              onClick={handleResendCode}
            >
              Resend
            </button>
          </p>
        </form>
      )}

      {/* ─── Forgot password ─── */}
      {screen === "forgot-password" && (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              className={inputClass}
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            className={primaryBtnClass}
            disabled={loading}
          >
            {loading ? "Sending…" : "Send reset code"}
          </button>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            <button
              type="button"
              className={linkBtnClass}
              onClick={() => {
                setScreen("sign-in");
                clearError();
              }}
            >
              ← Back to sign in
            </button>
          </p>
        </form>
      )}

      {/* ─── Confirm reset ─── */}
      {screen === "confirm-reset" && (
        <form onSubmit={handleConfirmReset} className="space-y-4">
          <div>
            <label className={labelClass}>Reset code</label>
            <input
              type="text"
              className={inputClass}
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              placeholder="123456"
              required
              autoFocus
              inputMode="numeric"
            />
          </div>
          <div>
            <label className={labelClass}>New password</label>
            <input
              type="password"
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            className={primaryBtnClass}
            disabled={loading}
          >
            {loading ? "Resetting…" : "Reset password"}
          </button>
        </form>
      )}
    </div>
  );
};
