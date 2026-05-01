import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth/server";
import { cookies } from "next/headers";
import { amplifyConfig } from "./amplify-config";

export const { runWithAmplifyServerContext } = createServerRunner({
  config: amplifyConfig,
});

export type CognitoServerUser = {
  userId: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

export const getServerAuthUser = async (): Promise<CognitoServerUser | null> => {
  try {
    const cookieStore = cookies();
    const user = await runWithAmplifyServerContext({
      nextServerContext: { cookies: () => cookieStore },
      operation: (contextSpec) => getCurrentUser(contextSpec),
    });
    return {
      userId: user.userId,
      username: user.username,
      email: user.signInDetails?.loginId,
    };
  } catch {
    return null;
  }
};

export const getServerAuthToken = async (): Promise<string | null> => {
  try {
    const cookieStore = cookies();
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies: () => cookieStore },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    return session.tokens?.accessToken?.toString() ?? null;
  } catch {
    return null;
  }
};
