import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('Verifying database setup...');

    // Get counts from each table
    const [achievementsRes, itemsRes, missionsRes, perksRes, badgesRes] = await Promise.all([
      supabase.from('achievements').select('*', { count: 'exact', head: true }),
      supabase.from('items').select('*', { count: 'exact', head: true }),
      supabase.from('missions').select('*', { count: 'exact', head: true }),
      supabase.from('perks').select('*', { count: 'exact', head: true }),
      supabase.from('badges').select('*', { count: 'exact', head: true })
    ]);

    const verification = {
      achievements: achievementsRes.count || 0,
      items: itemsRes.count || 0,
      missions: missionsRes.count || 0,
      perks: perksRes.count || 0,
      badges: badgesRes.count || 0,
      total: (achievementsRes.count || 0) + (itemsRes.count || 0) + (missionsRes.count || 0) + (perksRes.count || 0) + (badgesRes.count || 0)
    };

    console.log('Database verification:', verification);
    return NextResponse.json(verification);

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify database' },
      { status: 500 }
    );
  }
}