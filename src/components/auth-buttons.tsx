import React from "react";
import { Button, B3Size } from "./elements";
import { useTranslate } from "src/hooks/use-translate";
import { isAuthEnabled } from "src/global-config";
import { UserIcon } from "src/icons";
import { useCognitoAuth } from "src/providers/cognito-auth-context";

export const SignInButton = ({
  onClick,
  autoFocus = false,
  children,
}: {
  onClick?: () => void;
  autoFocus?: boolean;
  children?: React.ReactNode;
  // Accepted for API compatibility with former Clerk usage; ignored by Cognito
  // since authentication uses an in-page dialog rather than a redirect.
  forceRedirectUrl?: string;
  signInForceRedirectUrl?: string;
  signUpForceRedirectUrl?: string;
}) => {
  const translate = useTranslate();
  const { openSignIn } = useCognitoAuth();

  if (!isAuthEnabled) return null;

  const handleClick = () => {
    openSignIn();
    onClick?.();
  };

  if (children) {
    return <span onClick={handleClick}>{children}</span>;
  }

  return (
    <Button
      variant="quiet"
      className="text-blue-500 font-semibold"
      autoFocus={autoFocus}
      onClick={handleClick}
    >
      {translate("login")}
    </Button>
  );
};

export const SignUpButton = ({
  onClick,
  autoFocus = false,
  size = "sm",
}: {
  size?: B3Size | "full-width";
  onClick?: () => void;
  autoFocus?: boolean;
}) => {
  const translate = useTranslate();
  const { openSignUp } = useCognitoAuth();

  if (!isAuthEnabled) return null;

  const handleClick = () => {
    openSignUp();
    onClick?.();
  };

  return (
    <Button
      variant="primary"
      size={size}
      onClick={handleClick}
      autoFocus={autoFocus}
    >
      <UserIcon /> {translate("register")}
    </Button>
  );
};
