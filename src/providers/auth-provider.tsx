import React from "react";
import { CognitoAuthProvider } from "./cognito-auth-context";
import { CognitoLoginDialog } from "src/components/auth/cognito-login-dialog";
import { isAuthEnabled } from "src/global-config";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthEnabled) {
    return children as JSX.Element;
  }

  return (
    <CognitoAuthProvider>
      <CognitoLoginDialog />
      {children}
    </CognitoAuthProvider>
  );
};
