import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../../lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Get user by username to get user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's current rank based on XP
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('xp, level')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 });
    }

    // Get all ranks ordered by min_xp
    const { data: ranks, error: ranksError } = await supabase
      .from('ranks')
      .select('id, name, image_url, min_xp, max_xp, tier')
      .order('min_xp', { ascending: true });

    if (ranksError) {
      console.error('Error fetching ranks:', ranksError);
      return NextResponse.json({ error: 'Failed to fetch ranks' }, { status: 500 });
    }

    // Find current rank based on XP
    const currentRank = ranks.find(rank =>
      userData.xp >= rank.min_xp && (rank.max_xp === null || userData.xp <= rank.max_xp)
    ) || ranks[0]; // Default to first rank if none found

    // Format ranks for response
    const formattedRanks = ranks.map(rank => ({
      id: rank.id,
      rank_name: rank.name,
      rank_image: rank.image_url || `/ranks/${rank.name.toLowerCase().replace(/\s+/g, '')}.png`,
      min_xp: rank.min_xp,
      max_xp: rank.max_xp,
      tier: rank.tier,
      is_current: rank.id === currentRank?.id
    }));

    return NextResponse.json({
      success: true,
      ranks: formattedRanks,
      current_rank: currentRank ? {
        id: currentRank.id,
        name: currentRank.name,
        image_url: currentRank.image_url || `/ranks/${currentRank.name.toLowerCase().replace(/\s+/g, '')}.png`,
        tier: currentRank.tier
      } : null
    });

  } catch (error) {
    console.error('Error fetching user ranks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}