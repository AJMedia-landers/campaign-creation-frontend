import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_BASE!;

export async function POST(req: NextRequest) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: any = await req.json()

  try {
    const res = await fetch(`${API}/api/client-names`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let json: any;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }

    return NextResponse.json(json, { status: res.status });
  } catch (err) {
    console.error("Error creating flow config:", err);
    return NextResponse.json(
      { success: false, message: "Internal error while creating flow config" },
      { status: 500 }
    );
  }
}
