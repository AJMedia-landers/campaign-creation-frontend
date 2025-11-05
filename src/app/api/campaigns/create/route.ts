import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { CampaignRequestInput, CampaignCreateResponse } from "@/types/campaign";

const BACKEND_BASE = process.env.BACKEND_BASE; // e.g., http://localhost:5000

export async function POST(req: NextRequest) {
  let payload: CampaignRequestInput;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json<CampaignCreateResponse>(
      { success: false, message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  // pick token from our auth cookie
  const token = (await cookies()).get("cc_token")?.value;

  // REQUIRE auth
  if (!token) {
    return NextResponse.json<CampaignCreateResponse>(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  // Proxy to real backend if configured
  if (BACKEND_BASE) {
    const r = await fetch(`${BACKEND_BASE}/api/campaigns/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    let json: any;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!r.ok) {
      return NextResponse.json<CampaignCreateResponse>(
        { success: false, message: json?.message || `Backend error (${r.status})` },
        { status: r.status }
      );
    }
    return NextResponse.json<CampaignCreateResponse>({
      success: true,
      message: json?.message || "Campaign request created",
      data: json?.data || { id: json?.id ?? "unknown", input: payload }
    });
  }

  // MOCK: return success with a fake id
  const fakeId = `mock-${Date.now()}`;
  return NextResponse.json<CampaignCreateResponse>({
    success: true,
    message: "Mock: campaign request accepted",
    data: { id: fakeId, input: payload }
  });
}
