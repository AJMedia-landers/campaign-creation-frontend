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
  const id = searchParams.get("id");

  try {
    const backendRes = await fetch(
      `${API}/api/client-names/${id}`,
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
