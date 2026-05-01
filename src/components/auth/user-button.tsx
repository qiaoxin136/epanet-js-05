"use client";

import React, { useState, useRef, useEffect } from "react";
import { isAuthEnabled } from "src/global-config";
import { useCognitoAuth } from "src/providers/cognito-auth-context";
import { usePermissions } from "src/hooks/use-permissions";

const UserButtonWithAuth = () => {
  const { authUser, signOut } = useCognitoAuth();
  const { canManageOrganization } = usePermissions();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!authUser) return null;

  const initials = [authUser.firstName, authUser.lastName]
    .filter(Boolean)
    .map((n) => n![0].toUpperCase())
    .join("") || authUser.email[0].toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label="User menu"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 min-w-[200px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {[authUser.firstName, authUser.lastName].filter(Boolean).join(" ") || "Account"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{authUser.email}</p>
          </div>

          <button
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export const UserButton = isAuthEnabled
  ? UserButtonWithAuth
  : () => <button></button>;
