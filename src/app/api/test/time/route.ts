import { NextResponse } from 'next/server';

export async function GET() {
  const now = Date.now();
  const date = new Date(now);
  
  return NextResponse.json({
    timestamp: now,
    readable: date.toISOString(),
    readable_local: date.toString()
  });
}