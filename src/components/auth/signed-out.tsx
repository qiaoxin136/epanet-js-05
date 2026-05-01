import React from "react";
import { isAuthEnabled } from "src/global-config";
import { useCognitoAuth } from "src/providers/cognito-auth-context";

const SignedOutWithAuth = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useCognitoAuth();
  if (isSignedIn) return null;
  return <>{children}</>;
};

export const SignedOut = isAuthEnabled
  ? SignedOutWithAuth
  : ({ children }: { children: React.ReactNode }) => <>{children}</>;
