import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_BASE!;

export async function PATCH(req: NextRequest) {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 });
    }
    let bodyObj: any = null;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      bodyObj = await req.json();
    } else {
      const formData = await req.formData();
      const dataStr = formData.get("data");
      bodyObj = dataStr ? JSON.parse(String(dataStr)) : {};
    }

    const res = await fetch(`${API}/api/campaigns/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyObj),
    });

    const text = await res.text();
    let json: any;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }

    if (!res.ok || json?.success === false) {
      return NextResponse.json({ success: false, status: res.status, ...json }, { status: res.status });
    }

    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, status: 500, message: "Failed to update campaign", error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
