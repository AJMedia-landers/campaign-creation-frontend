import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export async function GET(request: NextRequest) {
    try {
        const token = (await cookies()).get("token")?.value;
        console.log(token)
        if (!token) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const queryString = searchParams.toString();

        const response = await fetch(
            `${API_URL}/api/tracking-links/platforms${queryString ? `?${queryString}` : ""}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            }
        );

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error("Get platforms error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Failed to get platforms",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const response = await fetch(`${API_URL}/api/tracking-links/platforms`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: request.headers.get("cookie") || "",
            },
            credentials: "include",
            body: JSON.stringify(body),
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error("Create platform error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Failed to create platform",
            },
            { status: 500 }
        );
    }
}