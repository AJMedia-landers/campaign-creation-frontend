import { NextResponse } from "next/server";

// replace with real backend later
const MOCK_REQUESTERS = [
  "Mai",
  "Jared",
  "Janessa",
  "Ivan",
  "AJ",
  "Uliana"
];

export async function GET() {
  return NextResponse.json(MOCK_REQUESTERS);
}