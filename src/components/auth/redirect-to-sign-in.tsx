"use client";

import { useEffect } from "react";
import { isAuthEnabled } from "src/global-config";
import { useCognitoAuth } from "src/providers/cognito-auth-context";

// signInForceRedirectUrl is accepted for API compatibility but ignored —
// Cognito uses an in-page dialog rather than a redirect.
type Props = {
  signInForceRedirectUrl?: string;
  forceRedirectUrl?: string;
};

const RedirectToSignInWithAuth = (_props: Props) => {
  const { openSignIn } = useCognitoAuth();
  useEffect(() => {
    openSignIn();
  }, [openSignIn]);
  return null;
};

export const RedirectToSignIn = isAuthEnabled
  ? RedirectToSignInWithAuth
  : (_props: Props) => null;
