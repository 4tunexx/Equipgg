import { NextRequest, NextResponse } from 'next/server';

// Seeding endpoint disabled. Supabase is the source of truth and already populated.
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Seeding disabled in this build. Use Supabase data.' }, { status: 410 });
}
