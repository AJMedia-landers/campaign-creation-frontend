import { NextRequest, NextResponse } from "next/server";
import { setSession } from "@/lib/auth";

const AUTH_API_BASE = process.env.AUTH_API_BASE; // e.g., https://api.your-backend.com

export async function POST(req: NextRequest) {
  const body = await req.json();

  // If backend is configured, proxy to it
  if (AUTH_API_BASE) {
    const r = await fetch(`${AUTH_API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await r.json();
    if (!r.ok || !json?.success) {
      return NextResponse.json({ success: false, message: json?.message || "Login failed" }, { status: r.status || 401 });
    }
    const { user, token } = json.data;
    const res = NextResponse.json({ success: true, message: json.message, data: { user } });
    setSession(res, token, user);
    return res;
  }

  // MOCK: read bundled users
  const users: any[] = (await import("@/data/mock-users.json")).default;
  const user = users.find(u => u.email === body.email && u.password === body.password);
  if (!user) {
    return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 });
  }
  const token = `mock.${user.id}.${Date.now()}`;
  const res = NextResponse.json({
    success: true,
    message: "Login successful",
    data: { user: { ...user, password: undefined } }
  });
  setSession(res, token, user);
  return res;
}
