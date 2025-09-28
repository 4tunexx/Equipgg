import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  console.log('=== TEST API CALLED ===');
  return NextResponse.json({ success: true, message: 'Test API works' });
}

export async function POST(request: NextRequest) {
  console.log('=== TEST API POST CALLED ===');
  return NextResponse.json({ success: true, message: 'Test POST works' });
}