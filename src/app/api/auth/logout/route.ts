import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to logout' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}


