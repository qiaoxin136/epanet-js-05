/**
 * Cognito Post-Confirmation Lambda trigger endpoint.
 *
 * Set this URL as the trigger destination in a Cognito Lambda function
 * configured on "Post confirmation" trigger. The Lambda forwards the
 * Cognito trigger event payload here with a shared secret header.
 *
 * Required env vars:
 *   COGNITO_TRIGGER_SECRET - shared secret between Lambda and this endpoint
 */
import { NextRequest, NextResponse } from "next/server";
import { assignEducationPlan } from "src/lib/cognito-admin";
import { Plan } from "src/lib/account-plans";
import {
  buildUserCreatedMessage,
  sendWithoutCrashing,
} from "src/infra/slack";
import { captureError } from "src/infra/error-tracking";
import { addToSubscribers } from "src/infra/newsletter";
import { logger } from "src/infra/server-logger";

type CognitoTriggerPayload = {
  triggerSource: string;
  userName: string;
  request: {
    userAttributes: Record<string, string>;
  };
};

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-trigger-secret");
  const configSecret = process.env.COGNITO_TRIGGER_SECRET;

  if (configSecret && secret !== configSecret) {
    logger.info("Cognito trigger secret mismatch");
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const payload: CognitoTriggerPayload = await request.json();

  if (!payload.triggerSource?.includes("PostConfirmation")) {
    return NextResponse.json({ status: "skipped" });
  }

  const attrs = payload.request.userAttributes;
  const username = payload.userName;
  const email = attrs.email || "";
  const firstName = attrs.given_name || "";
  const lastName = attrs.family_name || "";

  logger.info(`Post-confirmation trigger for user ${email}`);

  let plan: Plan = "free";

  const isStudent = await checkStudentEmail(email);
  if (isStudent) {
    await assignEducationPlan(username, email);
    plan = "education";
  }

  const message = buildUserCreatedMessage(email, firstName, lastName, plan);
  await sendWithoutCrashing(message);

  const result = await addToSubscribers(email, firstName, lastName);
  if (result.status === "failure") {
    captureError(new Error(`Unable to add ${email} to subscribers`));
    return new NextResponse("Error", { status: 500 });
  }

  return NextResponse.json({ status: "success" });
}

const checkStudentEmail = async (email: string): Promise<boolean> => {
  const checkerUrl = process.env.SWOT_CHECKER_URL as string;
  if (!checkerUrl) {
    logger.info("Swot checker url is not configured, skipping...");
    return false;
  }

  try {
    const response = await fetch(checkerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    return data.academic === true;
  } catch (error) {
    const msg = `Error checking student email ${(error as Error).message}`;
    logger.error(msg);
    captureError(new Error(msg));
    return false;
  }
};
