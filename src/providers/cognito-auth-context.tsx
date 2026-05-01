"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Amplify } from "aws-amplify";
import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  signOut as amplifySignOut,
} from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { amplifyConfig } from "src/lib/amplify-config";
import { Plan } from "src/lib/account-plans";
import { allSupportedLanguages, Locale } from "src/infra/i18n/locale";

Amplify.configure(amplifyConfig, { ssr: true });

export type CognitoUserAttributes = {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  "custom:userPlan"?: string;
  "custom:trialActivatedAt"?: string;
  "custom:trialEndsAt"?: string;
  "custom:hasUsedTrial"?: string;
  "custom:locale"?: string;
};

export type CognitoAuthUser = {
  userId: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  plan: Plan;
  trialActivatedAt: string | null;
  trialEndsAt: string | null;
  hasUsedTrial: boolean;
  locale?: Locale;
};

type AuthContextValue = {
  isLoaded: boolean;
  isSignedIn: boolean;
  authUser: CognitoAuthUser | null;
  signOut: (opts?: { redirectUrl?: string }) => Promise<void>;
  reload: () => Promise<void>;
  openSignIn: () => void;
  openSignUp: () => void;
  loginDialogState: "hidden" | "sign-in" | "sign-up";
  closeLoginDialog: () => void;
};

const CognitoAuthContext = createContext<AuthContextValue>({
  isLoaded: false,
  isSignedIn: false,
  authUser: null,
  signOut: async () => {},
  reload: async () => {},
  openSignIn: () => {},
  openSignUp: () => {},
  loginDialogState: "hidden",
  closeLoginDialog: () => {},
});

const mapAttributes = (attrs: CognitoUserAttributes): CognitoAuthUser => {
  const locale = attrs["custom:locale"] as Locale | undefined;
  return {
    userId: attrs.sub,
    username: attrs.email,
    email: attrs.email,
    firstName: attrs.given_name,
    lastName: attrs.family_name,
    plan: (attrs["custom:userPlan"] || "free") as Plan,
    trialActivatedAt: attrs["custom:trialActivatedAt"] ?? null,
    trialEndsAt: attrs["custom:trialEndsAt"] ?? null,
    hasUsedTrial: attrs["custom:hasUsedTrial"] === "true",
    locale: locale && allSupportedLanguages.includes(locale) ? locale : undefined,
  };
};

const loadAuthUser = async (): Promise<CognitoAuthUser | null> => {
  try {
    const [cognitoUser, session] = await Promise.all([
      getCurrentUser(),
      fetchAuthSession(),
    ]);
    if (!session.tokens) return null;

    const attrs = (await fetchUserAttributes()) as CognitoUserAttributes;
    return mapAttributes({ ...attrs, sub: cognitoUser.userId });
  } catch {
    return null;
  }
};

export const CognitoAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [authUser, setAuthUser] = useState<CognitoAuthUser | null>(null);
  const [loginDialogState, setLoginDialogState] = useState<
    "hidden" | "sign-in" | "sign-up"
  >("hidden");
  const initialized = useRef(false);

  const refresh = useCallback(async () => {
    const user = await loadAuthUser();
    setAuthUser(user);
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    loadAuthUser()
      .then(setAuthUser)
      .finally(() => setIsLoaded(true));

    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signedIn":
          void refresh();
          break;
        case "signedOut":
          setAuthUser(null);
          break;
        case "tokenRefresh":
          void refresh();
          break;
      }
    });

    return unsubscribe;
  }, [refresh]);

  const signOut = useCallback(
    async ({ redirectUrl }: { redirectUrl?: string } = {}) => {
      await amplifySignOut();
      setAuthUser(null);
      window.location.href = redirectUrl ?? "/login";
    },
    [],
  );

  return (
    <CognitoAuthContext.Provider
      value={{
        isLoaded,
        isSignedIn: !!authUser,
        authUser,
        signOut,
        reload: refresh,
        openSignIn: () => setLoginDialogState("sign-in"),
        openSignUp: () => setLoginDialogState("sign-up"),
        loginDialogState,
        closeLoginDialog: () => setLoginDialogState("hidden"),
      }}
    >
      {children}
    </CognitoAuthContext.Provider>
  );
};

export const useCognitoAuth = () => useContext(CognitoAuthContext);
