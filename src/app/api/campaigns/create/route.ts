import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_BASE!; // http://18.212.230.86

export async function POST(req: Request) {
  const token = (await cookies()).get("token")?.value;
  if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();

  const res = await fetch(`${API}/api/campaigns/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },

    body: formData,
  });

  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!res.ok || json?.success === false) {
    return NextResponse.json(json, { status: res.status });
  }

  return NextResponse.json(json);
}
