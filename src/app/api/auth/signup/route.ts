import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_BASE!;

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(`${API}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok || !json?.success) {
    return NextResponse.json(
      { success: false, message: json?.message ?? "Sign up failed" },
      { status: res.status || 400 }
    );
  }

  // Signup now returns { email, verification_required } — no token until verified.
  return NextResponse.json({
    success: true,
    message: json.message,
    data: json.data,
  });
}
