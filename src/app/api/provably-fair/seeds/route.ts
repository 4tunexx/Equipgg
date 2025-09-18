import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: "Provably fair feature is temporarily unavailable during database migration" 
  }, { status: 503 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: "Provably fair feature is temporarily unavailable during database migration" 
  }, { status: 503 });
}
