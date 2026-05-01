import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "src/lib/cognito-server";
import { adminGetUser } from "src/lib/cognito-admin";
import jwt from "jsonwebtoken";
import { buildCannyAuthData } from "src/lib/build-canny-auth-data";

export async function GET(request: NextRequest) {
  const serverUser = await getServerAuthUser();

  if (!serverUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await adminGetUser(serverUser.username);

  const redirect = request.nextUrl.searchParams.get("redirect");
  const companyID = request.nextUrl.searchParams.get("companyID");

  if (!redirect || !companyID) {
    return new NextResponse(
      "Missing required parameters: redirect and companyID",
      { status: 400 },
    );
  }

  const privateKey = process.env.CANNY_PRIVATE_KEY;

  if (!privateKey) {
    return new NextResponse("Server configuration error", { status: 500 });
  }

  const userData = buildCannyAuthData(user);
  const ssoToken = jwt.sign(userData, privateKey, { algorithm: "HS256" });

  const cannyUrl = new URL("https://canny.io/api/redirects/sso");
  cannyUrl.searchParams.set("redirect", redirect);
  cannyUrl.searchParams.set("companyID", companyID);
  cannyUrl.searchParams.set("ssoToken", ssoToken);

  return NextResponse.redirect(cannyUrl.toString());
}
