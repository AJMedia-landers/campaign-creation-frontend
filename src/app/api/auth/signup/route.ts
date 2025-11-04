import { NextRequest, NextResponse } from "next/server";
import { setSession } from "@/lib/auth";

const AUTH_API_BASE = process.env.AUTH_API_BASE;

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (AUTH_API_BASE) {
    const r = await fetch(`${AUTH_API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await r.json();
    if (!r.ok || !json?.success) {
      return NextResponse.json({ success: false, message: json?.message || "Sign up failed" }, { status: r.status || 400 });
    }
    const { user, token } = json.data;
    const res = NextResponse.json({ success: true, message: json.message, data: { user } });
    setSession(res, token, user);
    return res;
  }

  // MOCK
  const usersMod = await import("@/data/mock-users.json");
  const users: any[] = usersMod.default as any[];
  if (users.find(u => u.email === body.email)) {
    return NextResponse.json({ success: false, message: "User with this email already exists" }, { status: 409 });
  }
  const newUser = {
    id: users[users.length - 1]?.id + 1 || 1,
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email,
    password: body.password,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  // In a real DB we’d write to disk
  users.push(newUser);

  const token = `mock.${newUser.id}.${Date.now()}`;
  const res = NextResponse.json({ success: true, message: "User registered successfully", data: { user: { ...newUser, password: undefined } } });
  setSession(res, token, newUser);
  return res;
}
