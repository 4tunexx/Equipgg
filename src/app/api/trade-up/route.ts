import { NextRequest, NextResponse } from "next/server";

// Legacy database route - disabled during Supabase migration
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: "This feature is temporarily unavailable during database migration" 
  }, { status: 503 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: "This feature is temporarily unavailable during database migration" 
  }, { status: 503 });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ 
    error: "This feature is temporarily unavailable during database migration" 
  }, { status: 503 });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ 
    error: "This feature is temporarily unavailable during database migration" 
  }, { status: 503 });
}
