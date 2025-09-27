import { NextRequest, NextResponse } from 'next/server';

// Featured items seeding/management disabled to avoid modifying production Supabase.
export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Feature disabled. Use Supabase data.' }, { status: 410 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Feature disabled. Use Supabase data.' }, { status: 410 });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ error: 'Feature disabled. Use Supabase data.' }, { status: 410 });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ error: 'Feature disabled. Use Supabase data.' }, { status: 410 });
}
