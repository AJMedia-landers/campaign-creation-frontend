import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_BASE!; // http://18.212.230.86

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok || !json?.success) {
    return NextResponse.json(
      { success: false, message: json?.message ?? "Login failed" },
      { status: res.status || 401 }
    );
  }

  const token: string = json.data.token;
  (await cookies()).set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  (await cookies()).set("cc_token", token, {
    httpOnly: true, sameSite: "lax", path: "/",
  });

  return NextResponse.json({
    success: true,
    data: { user: json.data.user, token },
  });
}
