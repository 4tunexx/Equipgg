import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

// User Perks System
export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, vip_tier, level, last_daily_claim, login_streak, created_at')
      .eq('id', session.user_id)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    // Get all active perks from database
    const { data: perksData, error: perksError } = await supabase
      .from('perks')
      .select('*')
      .eq('is_active', true);

    if (perksError) {
      console.error('Error fetching perks:', perksError);
      return NextResponse.json({ error: 'Failed to fetch perks' }, { status: 500 });
    }

    // Get user's perk claims today
    const today = new Date().toISOString().split('T')[0];
    const { data: claimsToday, error: claimsError } = await supabase
      .from('user_perk_claims')
      .select('perk_type, claimed_at')
      .eq('user_id', session.user_id)
      .gte('claimed_at', today + 'T00:00:00Z')
      .lt('claimed_at', today + 'T23:59:59Z');

    if (claimsError && claimsError.code !== 'PGRST116') {
      console.error('Error fetching perk claims:', claimsError);
    }

    // Calculate available perks based on database data
    const availablePerks: Array<{
      id: any;
      type: any;
      name: any;
      description: any;
      amount: number;
      available: boolean;
      category: any;
      perk_type: any;
      coin_price: any;
      gem_price: any;
      duration_hours: any;
    }> = [];
    const claimedToday = (claimsToday || []).map((c: any) => c.perk_type);

    for (const perk of perksData || []) {
      let available = false;
      let amount = 0;
      let description = perk.description;

      // Check if this perk type was already claimed today
      const alreadyClaimed = claimedToday.includes(perk.perk_type);

      switch (perk.perk_type) {
        case 'daily_bonus':
          if (!alreadyClaimed) {
            const vipMultiplier = userData.vip_tier ?
              (perk.effect_value * (userData.vip_tier === 'bronze' ? 1.05 :
                                   userData.vip_tier === 'silver' ? 1.1 :
                                   userData.vip_tier === 'gold' ? 1.15 :
                                   userData.vip_tier === 'platinum' ? 1.2 : 1)) : perk.effect_value;
            amount = Math.floor(vipMultiplier);
            available = true;
          }
          break;
        case 'level_bonus':
          if (!alreadyClaimed && userData.level > 1) {
            amount = perk.effect_value + (userData.level * 10);
            available = true;
          }
          break;
        case 'streak_bonus':
          if (!alreadyClaimed && userData.login_streak > 1) {
            amount = Math.min(userData.login_streak, 7) * perk.effect_value;
            description = `${userData.login_streak} day streak bonus`;
            available = true;
          }
          break;
        case 'referral_bonus':
          if (!alreadyClaimed) {
            amount = perk.effect_value;
            available = true;
          }
          break;
        default:
          // For other perks, they're available for purchase if user can afford them
          available = true;
          amount = perk.coin_price;
          break;
      }

      if (available) {
        availablePerks.push({
          id: perk.id,
          type: perk.perk_type,
          name: perk.name,
          description,
          amount,
          available: true,
          category: perk.category,
          perk_type: perk.perk_type,
          coin_price: perk.coin_price,
          gem_price: perk.gem_price,
          duration_hours: perk.duration_hours
        });
      }
    }

    return NextResponse.json({
      success: true,
      availablePerks,
      userLevel: userData.level,
      vipTier: userData.vip_tier,
      loginStreak: userData.login_streak,
      lastDailyClaim: userData.last_daily_claim
    });

  } catch (error) {
    console.error('Error in perks API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { perkId } = await request.json();

    if (!perkId) {
      return NextResponse.json({
        error: 'Perk ID is required'
      }, { status: 400 });
    }

    // Get perk data from database
    const { data: perkData, error: perkError } = await supabase
      .from('perks')
      .select('*')
      .eq('id', parseInt(perkId))
      .eq('is_active', true)
      .single();

    if (perkError || !perkData) {
      return NextResponse.json({
        error: 'Invalid perk ID'
      }, { status: 400 });
    }

    // Check if perk was already claimed today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingClaim } = await supabase
      .from('user_perk_claims')
      .select('id')
      .eq('user_id', session.user_id)
      .eq('perk_type', perkData.perk_type)
      .gte('claimed_at', today + 'T00:00:00Z')
      .lt('claimed_at', today + 'T23:59:59Z')
      .single();

    if (existingClaim) {
      return NextResponse.json({
        error: 'Perk already claimed today'
      }, { status: 400 });
    }

    // Get user data for calculations
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('coins, vip_tier, level, login_streak, last_daily_claim')
      .eq('id', session.user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate perk reward based on perk type
    let rewardAmount = 0;
    let perkName = perkData.name;

    switch (perkData.perk_type) {
      case 'daily_bonus':
        const vipMultiplier = userData.vip_tier ? 
          (userData.vip_tier === 'bronze' ? 1.05 : 
           userData.vip_tier === 'silver' ? 1.1 : 
           userData.vip_tier === 'gold' ? 1.15 : 
           userData.vip_tier === 'platinum' ? 1.2 : 1) : 1;
        rewardAmount = Math.floor(perkData.effect_value * vipMultiplier);
        break;
      case 'level_bonus':
        rewardAmount = perkData.effect_value + (userData.level * 10);
        break;
      case 'streak_bonus':
        rewardAmount = Math.min(userData.login_streak, 7) * perkData.effect_value;
        break;
      case 'referral_bonus':
        rewardAmount = perkData.effect_value;
        break;
      default:
        rewardAmount = perkData.effect_value;
        break;
    }

    // Award the coins
    const { error: updateError } = await supabase
      .from('users')
      .update({
        coins: userData.coins + rewardAmount,
        last_daily_claim: perkData.perk_type === 'daily_bonus' ? new Date().toISOString() : userData.last_daily_claim
      })
      .eq('id', session.user_id);

    if (updateError) {
      console.error('Error updating user coins:', updateError);
      return NextResponse.json({ error: 'Failed to claim perk' }, { status: 500 });
    }

    // Record the perk claim (only if table exists)
    try {
      await supabase.from('user_perk_claims').insert([{
        user_id: session.user_id,
        perk_type: perkData.perk_type,
        amount: rewardAmount,
        claimed_at: new Date().toISOString()
      }]);
    } catch (insertError) {
      console.log('Perk claims table not available, skipping record');
    }

    // Record transaction
    await supabase.from('user_transactions').insert([{
      user_id: session.user_id,
      type: 'perk_claim',
      amount: rewardAmount,
      description: `Claimed ${perkName}`,
      created_at: new Date().toISOString()
    }]);

    return NextResponse.json({
      success: true,
      message: `Successfully claimed ${perkName}`,
      perkId: perkData.id,
      perkType: perkData.perk_type,
      amount: rewardAmount,
      newBalance: userData.coins + rewardAmount
    });

  } catch (error) {
    console.error('Error claiming perk:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
