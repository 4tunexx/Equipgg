import { NextRequest, NextResponse } from 'next/server';

// Database population disabled. Supabase is the source of truth and already populated.
export async function POST(_: NextRequest) {
  return NextResponse.json({ error: 'Database population disabled. Use Supabase data.' }, { status: 410 });
}