import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC = [
  "/signin",
  "/signup",
  "/verify",
  "/_next",
  "/favicon.ico",
  "/assets",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
];

const TWO_DAYS_SECONDS = 60 * 60 * 24 * 2;

/**
 * Try to consume a one-time login token in the URL (?token=...).
 * Returns a response (cookie + redirect) on success/failure, or null if no token query.
 */
async function consumeQueryToken(req: NextRequest): Promise<NextResponse | null> {
  const raw = req.nextUrl.searchParams.get("token");
  if (!raw) return null;

  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  // Build a target URL with ?token= stripped so we can redirect back cleanly.
  const target = req.nextUrl.clone();
  target.searchParams.delete("token");

  if (!apiBase) {
    target.pathname = "/signin";
    target.searchParams.set("error", "missing_api_base");
    return NextResponse.redirect(target);
  }

  try {
    const res = await fetch(`${apiBase}/api/auth/login-with-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: raw }),
    });
    const json = await res.json().catch(() => ({} as any));

    if (!res.ok || !json?.success || !json?.data?.token) {
      target.pathname = "/signin";
      target.searchParams.set(
        "error",
        json?.message ? encodeURIComponent(String(json.message)) : "invalid_token",
      );
      return NextResponse.redirect(target);
    }

    const jwt: string = json.data.token;
    const response = NextResponse.redirect(target);
    response.cookies.set("token", jwt, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: TWO_DAYS_SECONDS,
    });
    response.cookies.set("cc_token", jwt, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch {
    target.pathname = "/signin";
    target.searchParams.set("error", "token_exchange_failed");
    return NextResponse.redirect(target);
  }
}

export async function middleware(req: NextRequest) {
  // 1) ?token=... on ANY URL → exchange for a JWT cookie, then redirect to the same URL without the param.
  const tokenResponse = await consumeQueryToken(req);
  if (tokenResponse) return tokenResponse;

  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get("token")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
