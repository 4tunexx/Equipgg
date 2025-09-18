import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: "Betting feature is temporarily unavailable during database migration" 
  }, { status: 503 });
}
