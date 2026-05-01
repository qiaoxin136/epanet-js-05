import { NextResponse } from "next/server";
import { getServerAuthUser } from "src/lib/cognito-server";
import { activateTrial, adminGetUser } from "src/lib/cognito-admin";
import { logger } from "src/infra/server-logger";
import {
  buildTrialActivatedMessage,
  sendWithoutCrashing,
} from "src/infra/slack";

export async function POST() {
  const serverUser = await getServerAuthUser();

  if (!serverUser) return new NextResponse("Unauthorized", { status: 401 });

  const user = await adminGetUser(serverUser.username);

  if (user.hasUsedTrial) {
    logger.info(`User ${serverUser.userId} already used trial`);
    return new NextResponse("Trial already used", { status: 400 });
  }

  if (user.userPlan !== "free") {
    logger.info(
      `User ${serverUser.userId} is on ${user.userPlan} plan, trial not applicable`,
    );
    return new NextResponse("Trial not available for current plan", {
      status: 400,
    });
  }

  logger.info(`Activating trial for user ${serverUser.userId}`);
  await activateTrial(serverUser.username);

  const trialEndsAt = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000,
  ).toLocaleDateString();

  const message = buildTrialActivatedMessage(
    user.email,
    user.firstName || "",
    user.lastName || "",
    trialEndsAt,
  );
  await sendWithoutCrashing(message);

  return NextResponse.json({ success: true });
}
