import { NextResponse, NextRequest } from "next/server";
import { CognitoJwtVerifier } from "aws-jwt-verify";

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const isAuthEnabled = !!userPoolId && !!clientId;

const verifier = isAuthEnabled
  ? CognitoJwtVerifier.create({
      userPoolId: userPoolId!,
      tokenUse: "access",
      clientId: clientId!,
    })
  : null;

const getAccessTokenFromCookies = (request: NextRequest): string | null => {
  if (!clientId) return null;

  const prefix = `CognitoIdentityServiceProvider.${clientId}`;
  const lastAuthUser = request.cookies.get(`${prefix}.LastAuthUser`)?.value;
  if (!lastAuthUser) return null;

  return (
    request.cookies.get(`${prefix}.${lastAuthUser}.accessToken`)?.value ?? null
  );
};

const isAuthenticated = async (request: NextRequest): Promise<boolean> => {
  if (!verifier) return false;
  const token = getAccessTokenFromCookies(request);
  if (!token) return false;
  try {
    await verifier.verify(token);
    return true;
  } catch {
    return false;
  }
};

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow API routes (they handle their own auth)
  if (pathname.startsWith("/api")) return NextResponse.next();

  // Always allow the login page itself (prevent redirect loop)
  if (pathname.startsWith("/login")) return NextResponse.next();

  // Allow Next.js internals and static files
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Protect all other routes — redirect to /login if not authenticated
  if (isAuthEnabled) {
    const authenticated = await isAuthenticated(request);
    if (!authenticated) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Authenticated — add cache-control headers and continue
  const response = NextResponse.next();
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|inp|csv|docx?|xlsx?|zip|txt|webmanifest)).*)",
  ],
};
