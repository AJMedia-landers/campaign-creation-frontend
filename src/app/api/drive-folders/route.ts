import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_BASE!;

export async function POST(req: NextRequest) {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { driveUrl } = body;

        if (!driveUrl) {
            return NextResponse.json(
                { success: false, message: "Drive URL is required" },
                { status: 400 }
            );
        }

        const res = await fetch(`${API}/api/campaigns/drive/folders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ driveUrl }),
        });

        const text = await res.text();
        let json: any;
        try {
            json = JSON.parse(text);
        } catch {
            json = { raw: text, success: false, message: "Failed to parse response" };
        }

        return NextResponse.json(json, { status: res.status });
    } catch (error) {
        console.error("Drive folders API error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Internal server error",
            },
            { status: 500 }
        );
    }
}