import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_BASE!;

export async function GET(req: NextRequest) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${API}/api/auth/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  let json: any; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return NextResponse.json(json, { status: res.status });
}
