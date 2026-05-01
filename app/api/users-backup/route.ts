import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { logger } from "src/infra/server-logger";
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export const dynamic = "force-dynamic";

const bucketName = "epanet-js-users-backups";

export async function GET(request: NextRequest) {
  if (
    process.env.CRON_SECRET &&
    request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  logger.info("Generating backup with all users");
  const data = await generateAllUsersJSON();

  const destination = `${Date.now()}.json`;

  const path = await store(bucketName, destination, data);

  return NextResponse.json({ status: "success", path });
}

const store = async (
  bucketName: string,
  destination: string,
  data: string,
): Promise<string> => {
  const path = `${bucketName}:${destination}`;
  const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
      client_email: process.env.GCP_CLIENT_EMAIL,
      private_key: process.env.GCP_PRIVATE_KEY,
    },
  });

  logger.info(`Storing item at ${path}`);
  await storage.bucket(bucketName).file(destination).save(data);

  return path;
};

const generateAllUsersJSON = async (): Promise<string> => {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  if (!userPoolId) {
    logger.error("COGNITO_USER_POOL_ID not configured");
    return JSON.stringify([]);
  }

  const client = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION || "us-east-1",
  });

  const result = [];
  let paginationToken: string | undefined;

  do {
    const cmd = new ListUsersCommand({
      UserPoolId: userPoolId,
      Limit: 60,
      PaginationToken: paginationToken,
    });
    const response = await client.send(cmd);
    result.push(...(response.Users ?? []));
    paginationToken = response.PaginationToken;
  } while (paginationToken);

  return JSON.stringify(result);
};
