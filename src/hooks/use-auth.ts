import { useCallback, useEffect, useState } from "react";
import { isAuthEnabled } from "src/global-config";
import { nullUser, User } from "src/auth-types";
import { useCognitoAuth } from "src/providers/cognito-auth-context";

export type UseAuthHook = () => {
  isLoaded: boolean;
  isSignedIn?: boolean;
  userId: string | null | undefined;
  user: User;
  signOut: ({ redirectUrl }: { redirectUrl?: string }) => void;
  reload: () => Promise<void>;
};

const AUTH_TIMEOUT_MS = 5000;

const useAuthWithCognito: UseAuthHook = () => {
  const { isLoaded, isSignedIn, authUser, signOut, reload } = useCognitoAuth();

  const user: User = authUser
    ? {
        id: authUser.userId,
        email: authUser.email,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        plan: authUser.plan,
        trialActivatedAt: authUser.trialActivatedAt,
        trialEndsAt: authUser.trialEndsAt,
        hasUsedTrial: authUser.hasUsedTrial,
        getLocale: () => authUser.locale,
        setLocale: async (locale) => {
          const { updateUserAttributes } = await import("aws-amplify/auth");
          await updateUserAttributes({
            userAttributes: { "custom:locale": locale },
          });
          await reload();
        },
      }
    : nullUser;

  return {
    isLoaded,
    isSignedIn,
    userId: authUser?.userId ?? undefined,
    user,
    signOut,
    reload,
  };
};

const useAuthWithTimeout: UseAuthHook = () => {
  const authData = useAuthWithCognito();
  const [isLoadedWithTimeout, setIsLoadedWithTimeout] = useState(false);

  useEffect(() => {
    if (authData.isLoaded) {
      setIsLoadedWithTimeout(true);
      return;
    }

    let isMounted = true;

    const intervalId = setInterval(() => {
      if (isMounted && authData.isLoaded) {
        setIsLoadedWithTimeout(true);
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      }
    }, 100);

    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setIsLoadedWithTimeout(true);
        clearInterval(intervalId);
      }
    }, AUTH_TIMEOUT_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [authData.isLoaded]);

  return {
    ...authData,
    isLoaded: isLoadedWithTimeout,
  };
};

const useAuthNull: UseAuthHook = () => {
  return {
    isLoaded: true,
    isSignedIn: false,
    userId: undefined,
    user: nullUser,
    signOut: () => {},
    reload: async () => {},
  };
};

export const useAuth = isAuthEnabled ? useAuthWithTimeout : useAuthNull;
