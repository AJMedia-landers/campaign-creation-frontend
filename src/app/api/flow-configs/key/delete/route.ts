import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_BASE!;

export async function DELETE(req: NextRequest) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const flowKey = searchParams.get("key");

  if (!flowKey) {
    return NextResponse.json(
      { success: false, message: "Missing flow key" },
      { status: 400 }
    );
  }

  try {
    const backendRes = await fetch(
      `${API}/api/flow-configs/key/${encodeURIComponent(flowKey)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const text = await backendRes.text();
    let json: any;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }

    return NextResponse.json(json, { status: backendRes.status });
  } catch (err) {
    console.error("Error deleting flow config:", err);
    return NextResponse.json(
      { success: false, message: "Internal error while deleting flow config" },
      { status: 500 }
    );
  }
}
