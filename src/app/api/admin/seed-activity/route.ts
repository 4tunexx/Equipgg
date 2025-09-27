import { NextRequest, NextResponse } from 'next/server';

// Activity seeding disabled to avoid modifying production Supabase.
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Activity seeding disabled. Use Supabase data.' }, { status: 410 });
}
