import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET() {
  try {
    // Check items count
    const { count: itemsCount, error: itemsError } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true });

    // Check ranks count
    const { count: ranksCount, error: ranksError } = await supabase
      .from('ranks')
      .select('*', { count: 'exact', head: true });

    // Check badges count
    const { count: badgesCount, error: badgesError } = await supabase
      .from('badges')
      .select('*', { count: 'exact', head: true });

    // Check achievements count
    const { count: achievementsCount, error: achievementsError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true });

    // Check crates count
    const { count: cratesCount, error: cratesError } = await supabase
      .from('crates')
      .select('*', { count: 'exact', head: true });

    // Check perks count
    const { count: perksCount, error: perksError } = await supabase
      .from('perks')
      .select('*', { count: 'exact', head: true });

    // Get sample data from each table
    const { data: sampleItems } = await supabase
      .from('items')
      .select('id, name, type, rarity')
      .limit(5);

    const { data: sampleRanks } = await supabase
      .from('ranks')
      .select('id, tier, min_level, max_level')
      .limit(5);

    const { data: sampleBadges } = await supabase
      .from('badges')
      .select('id, name, category, rarity')
      .limit(5);

    const { data: sampleAchievements } = await supabase
      .from('achievements')
      .select('id, name, description, xp_reward')
      .limit(5);

    const { data: sampleCrates } = await supabase
      .from('crates')
      .select('id, name, price, description')
      .limit(5);

    const { data: samplePerks } = await supabase
      .from('perks')
      .select('id, name, description, price')
      .limit(5);

    const result = {
      counts: {
        items: itemsCount || 0,
        ranks: ranksCount || 0,
        badges: badgesCount || 0,
        achievements: achievementsCount || 0,
        crates: cratesCount || 0,
        perks: perksCount || 0
      },
      errors: {
        items: itemsError?.message || null,
        ranks: ranksError?.message || null,
        badges: badgesError?.message || null,
        achievements: achievementsError?.message || null,
        crates: cratesError?.message || null,
        perks: perksError?.message || null
      },
      samples: {
        items: sampleItems || [],
        ranks: sampleRanks || [],
        badges: sampleBadges || [],
        achievements: sampleAchievements || [],
        crates: sampleCrates || [],
        perks: samplePerks || []
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json(
      { error: 'Failed to check database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}