import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  // Stripe webhook handler placeholder
  // Will be implemented in Phase 4
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
