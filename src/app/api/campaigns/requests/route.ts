import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_BASE!; // e.g. http://18.212.230.86

export async function PATCH(req: NextRequest) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const res = await fetch(`${API}/api/campaigns/requests/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!res.ok || json?.success === false) {
    return NextResponse.json({ success: false, status: res.status, ...json }, { status: res.status });
  }

  return NextResponse.json(json);
}
