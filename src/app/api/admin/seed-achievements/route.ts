import { NextRequest, NextResponse } from 'next/server';

// Achievements seeding disabled to avoid modifying production Supabase.
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Achievements seeding disabled. Use Supabase data.' }, { status: 410 });
}

