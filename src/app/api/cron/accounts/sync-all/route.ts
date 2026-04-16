import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_BASE!;

export const maxDuration = 300;

export async function POST() {
  const res = await fetch(`${API}/api/cron/accounts/sync-all`, {
    method: "GET",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
