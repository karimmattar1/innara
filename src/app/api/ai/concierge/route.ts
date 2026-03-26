import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  // AI concierge endpoint placeholder
  // Will be implemented in Phase 2
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
