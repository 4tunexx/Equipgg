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

    // Get user's badges from user_badges table
    const { data: userBadges, error: userBadgesError } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', user.id);

    if (userBadgesError) {
      console.error('Error fetching user badges:', userBadgesError);
      return NextResponse.json({ error: 'Failed to fetch user badges' }, { status: 500 });
    }

    // Get all available badges
    const { data: allBadges, error: allBadgesError } = await supabase
      .from('badges')
      .select('id, name, description, icon_url, category, rarity, requirement_type, requirement_value')
      .order('category', { ascending: true });

    if (allBadgesError) {
      console.error('Error fetching all badges:', allBadgesError);
      return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
    }

    // Format badges for response
    const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);

    const formattedBadges = allBadges.map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon_url: badge.icon_url,
      category: badge.category,
      rarity: badge.rarity,
      requirement_type: badge.requirement_type,
      requirement_value: badge.requirement_value,
      earned: earnedBadgeIds.has(badge.id),
      earned_at: userBadges?.find(ub => ub.badge_id === badge.id)?.earned_at || null
    }));

    return NextResponse.json({
      success: true,
      badges: formattedBadges,
      earned_count: earnedBadgeIds.size,
      total_count: allBadges.length
    });

  } catch (error) {
    console.error('Error fetching user badges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}