import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    app: "innara",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
