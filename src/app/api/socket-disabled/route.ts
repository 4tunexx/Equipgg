import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Socket.IO is not available on Vercel serverless deployment',
    fallbackMode: true
  }, { status: 503 });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'Socket.IO is not available on Vercel serverless deployment',
    fallbackMode: true
  }, { status: 503 });
}
