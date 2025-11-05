import { NextResponse } from "next/server";
import data from "@/data/mock-ad-accounts.json";

export type AdAccount = { id: string; name: string };

export async function GET() {
  return NextResponse.json(data as AdAccount[], { status: 200 });
}