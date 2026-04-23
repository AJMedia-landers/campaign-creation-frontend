import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_BASE!;

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(`${API}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  return NextResponse.json(
    { success: !!json?.success, message: json?.message ?? "Failed to resend code" },
    { status: res.status || 400 }
  );
}
