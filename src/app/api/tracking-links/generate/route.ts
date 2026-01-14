import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export async function POST(request: NextRequest) {
    try {
        const token = (await cookies()).get("token")?.value;
        if (!token) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const response = await fetch(`${API_URL}/api/tracking-links/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            body: JSON.stringify(body),
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error("Generate tracking link error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Failed to generate tracking link",
            },
            { status: 500 }
        );
    }
}