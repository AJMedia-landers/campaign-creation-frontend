import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export type AuthUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
};

export function setSession(res: NextResponse, token: string, user: AuthUser) {
  // HttpOnly cookie for token; readable cookie for tiny user stub (optional)
  res.cookies.set("cc_token", token, { httpOnly: true, path: "/", sameSite: "lax" });
  res.cookies.set("cc_user", JSON.stringify({ id: user.id, email: user.email, name: `${user.first_name} ${user.last_name}` }), {
    httpOnly: false, path: "/", sameSite: "lax"
  });
}

export function clearSession(res: NextResponse) {
  res.cookies.set("cc_token", "", { httpOnly: true, path: "/", maxAge: 0 });
  res.cookies.set("cc_user", "", { path: "/", maxAge: 0 });
}

export async function getTokenFromCookies() {
  return (await cookies()).get("cc_token")?.value || null;
}
