import {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
  AdminGetUserCommand,
  ListUsersCommand,
  type AttributeType,
} from "@aws-sdk/client-cognito-identity-provider";
import { logger } from "src/infra/server-logger";

const userPoolId = process.env.COGNITO_USER_POOL_ID!;

let instance: CognitoIdentityProviderClient | null = null;

const client = (): CognitoIdentityProviderClient => {
  if (instance) return instance;
  instance = new CognitoIdentityProviderClient({
    region: process.env.AWS_COGNITO_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
  });
  return instance;
};

const attr = (name: string, value: string): AttributeType => ({ Name: name, Value: value });

export type CognitoAdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  userPlan: string;
  trialActivatedAt: string | null;
  trialEndsAt: string | null;
  hasUsedTrial: boolean;
};

const parseUserAttributes = (
  username: string,
  attributes: AttributeType[] = [],
): CognitoAdminUser => {
  const get = (name: string) => attributes.find((a) => a.Name === name)?.Value ?? "";
  return {
    id: get("sub") || username,
    email: get("email"),
    firstName: get("given_name") || null,
    lastName: get("family_name") || null,
    userPlan: get("custom:userPlan") || "free",
    trialActivatedAt: get("custom:trialActivatedAt") || null,
    trialEndsAt: get("custom:trialEndsAt") || null,
    hasUsedTrial: get("custom:hasUsedTrial") === "true",
  };
};

export const adminGetUser = async (username: string): Promise<CognitoAdminUser> => {
  const cmd = new AdminGetUserCommand({ UserPoolId: userPoolId, Username: username });
  const result = await client().send(cmd);
  return parseUserAttributes(username, result.UserAttributes);
};

export const assignEducationPlan = async (username: string, email: string): Promise<void> => {
  logger.info(`Assigning education plan to user ${email}`);
  const cmd = new AdminUpdateUserAttributesCommand({
    UserPoolId: userPoolId,
    Username: username,
    UserAttributes: [attr("custom:userPlan", "education")],
  });
  await client().send(cmd);
};

export const upgradeUser = async (
  username: string,
  customerId: string,
  plan: string,
  paymentType: string,
): Promise<void> => {
  logger.info(`Upgrading user ${username} to ${plan}`);
  const cmd = new AdminUpdateUserAttributesCommand({
    UserPoolId: userPoolId,
    Username: username,
    UserAttributes: [
      attr("custom:userPlan", plan),
      attr("custom:paymentType", paymentType),
      attr("custom:stripeCustomerId", customerId),
    ],
  });
  await client().send(cmd);
};

const TRIAL_DURATION_DAYS = 14;

export const activateTrial = async (username: string): Promise<void> => {
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const cmd = new AdminUpdateUserAttributesCommand({
    UserPoolId: userPoolId,
    Username: username,
    UserAttributes: [
      attr("custom:trialActivatedAt", now.toISOString()),
      attr("custom:trialEndsAt", trialEndsAt.toISOString()),
      attr("custom:hasUsedTrial", "true"),
    ],
  });
  await client().send(cmd);
};

export const getRecentlyExpiredTrials = async (): Promise<CognitoAdminUser[]> => {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const cmd = new ListUsersCommand({ UserPoolId: userPoolId, Limit: 60 });
  const result = await client().send(cmd);

  return (result.Users ?? [])
    .map((u) => parseUserAttributes(u.Username!, u.Attributes))
    .filter((u) => {
      if (!u.hasUsedTrial || !u.trialEndsAt || u.userPlan !== "free") return false;
      const expiry = new Date(u.trialEndsAt).getTime();
      return expiry > oneDayAgo && expiry <= now;
    });
};
