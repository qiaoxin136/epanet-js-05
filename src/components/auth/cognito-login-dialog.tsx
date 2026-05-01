"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
} from "aws-amplify/auth";
import { useCognitoAuth } from "src/providers/cognito-auth-context";

type Screen =
  | "sign-in"
  | "sign-up"
  | "confirm-sign-up"
  | "forgot-password"
  | "confirm-reset";

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
const primaryBtnClass =
  "w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
const linkBtnClass =
  "text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer";
const errorClass = "rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";

export const CognitoLoginDialog = () => {
  const { loginDialogState, closeLoginDialog, openSignIn, openSignUp } =
    useCognitoAuth();

  const isOpen = loginDialogState !== "hidden";
  const [screen, setScreen] = useState<Screen>(
    loginDialogState === "sign-up" ? "sign-up" : "sign-in",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  // Sign-in fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign-up fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  // Confirm sign-up
  const [confirmCode, setConfirmCode] = useState("");

  // Forgot password
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const clearError = () => setError("");

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeLoginDialog();
      setError("");
    }
  };

  // Sync screen with dialog state when it opens
  React.useEffect(() => {
    if (isOpen) {
      setScreen(loginDialogState === "sign-up" ? "sign-up" : "sign-in");
      setError("");
    }
  }, [isOpen, loginDialogState]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      const result = await signIn({ username: email, password });
      if (result.isSignedIn) {
        closeLoginDialog();
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
        username: email,
        password: signUpPassword,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: lastName,
          },
        },
      });
      if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setPendingEmail(email);
        setScreen("confirm-sign-up");
      } else if (result.isSignUpComplete) {
        await signIn({ username: email, password: signUpPassword });
        closeLoginDialog();
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
      await confirmSignUp({ username: pendingEmail, confirmationCode: confirmCode });
      await signIn({ username: pendingEmail, password: signUpPassword });
      closeLoginDialog();
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
      setPassword(newPassword);
      setEmail(pendingEmail);
      setScreen("sign-in");
    } catch (err: unknown) {
      setError((err as Error).message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
          <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {screen === "sign-in" && "Sign in to epanet-js"}
            {screen === "sign-up" && "Create your account"}
            {screen === "confirm-sign-up" && "Verify your email"}
            {screen === "forgot-password" && "Reset your password"}
            {screen === "confirm-reset" && "Enter new password"}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            {screen === "sign-in" && "Enter your credentials to continue."}
            {screen === "sign-up" && "Fill in the details below to get started."}
            {screen === "confirm-sign-up" &&
              `We sent a confirmation code to ${pendingEmail}.`}
            {screen === "forgot-password" &&
              "We'll send a reset code to your email."}
            {screen === "confirm-reset" && "Enter the code we sent and your new password."}
          </Dialog.Description>

          {error && <p className={`${errorClass} mb-4`}>{error}</p>}

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
              </div>
              <div className="flex justify-end">
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
              <button type="submit" className={primaryBtnClass} disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                No account?{" "}
                <button
                  type="button"
                  className={linkBtnClass}
                  onClick={() => {
                    openSignUp();
                    clearError();
                  }}
                >
                  Sign up
                </button>
              </p>
            </form>
          )}

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              <button type="submit" className={primaryBtnClass} disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
              </button>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <button
                  type="button"
                  className={linkBtnClass}
                  onClick={() => {
                    openSignIn();
                    clearError();
                  }}
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

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
                />
              </div>
              <button type="submit" className={primaryBtnClass} disabled={loading}>
                {loading ? "Verifying…" : "Verify email"}
              </button>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Didn't receive the code?{" "}
                <button type="button" className={linkBtnClass} onClick={handleResendCode}>
                  Resend
                </button>
              </p>
            </form>
          )}

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
              <button type="submit" className={primaryBtnClass} disabled={loading}>
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
                  Back to sign in
                </button>
              </p>
            </form>
          )}

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
              <button type="submit" className={primaryBtnClass} disabled={loading}>
                {loading ? "Resetting…" : "Reset password"}
              </button>
            </form>
          )}

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
              aria-label="Close"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path
                  d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
