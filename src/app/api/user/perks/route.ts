import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

// User Perks System
const PERK_DEFINITIONS = {
  daily_bonus: { 
    name: 'Daily Bonus', 
    description: 'Claim free coins every 24 hours',
    baseAmount: 100,
    vipMultiplier: { bronze: 1.05, silver: 1.1, gold: 1.15, platinum: 1.2 }
  },
  level_bonus: {
    name: 'Level Bonus',
    description: 'Get bonus coins based on your level',
    baseAmount: 50,
    levelMultiplier: 10
  },
  referral_bonus: {
    name: 'Referral Bonus',
    description: 'Earn coins for successful referrals',
    baseAmount: 500
  },
  streak_bonus: {
    name: 'Login Streak',
    description: 'Extra coins for consecutive daily logins',
    maxStreak: 7,
    bonusPerDay: 25
  }
};

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

    // Calculate available perks
    const availablePerks = [];
    const claimedToday = (claimsToday || []).map(c => c.perk_type);

    // Daily Bonus
    if (!claimedToday.includes('daily_bonus')) {
      const perk = PERK_DEFINITIONS.daily_bonus;
      const vipMultiplier = userData.vip_tier ? perk.vipMultiplier[userData.vip_tier as keyof typeof perk.vipMultiplier] || 1 : 1;
      const amount = Math.floor(perk.baseAmount * vipMultiplier);
      
      availablePerks.push({
        type: 'daily_bonus',
        name: perk.name,
        description: perk.description,
        amount,
        available: true
      });
    }

    // Level Bonus (if user leveled up recently)
    if (!claimedToday.includes('level_bonus') && userData.level > 1) {
      const perk = PERK_DEFINITIONS.level_bonus;
      const amount = perk.baseAmount + (userData.level * perk.levelMultiplier);
      
      availablePerks.push({
        type: 'level_bonus',
        name: perk.name,
        description: perk.description,
        amount,
        available: true
      });
    }

    // Streak Bonus
    if (!claimedToday.includes('streak_bonus') && userData.login_streak > 1) {
      const perk = PERK_DEFINITIONS.streak_bonus;
      const amount = Math.min(userData.login_streak, perk.maxStreak) * perk.bonusPerDay;
      
      availablePerks.push({
        type: 'streak_bonus',
        name: perk.name,
        description: `${userData.login_streak} day streak bonus`,
        amount,
        available: true
      });
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

    const { perkType } = await request.json();

    if (!perkType || !PERK_DEFINITIONS[perkType as keyof typeof PERK_DEFINITIONS]) {
      return NextResponse.json({ 
        error: 'Invalid perk type' 
      }, { status: 400 });
    }

    // Check if perk was already claimed today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingClaim } = await supabase
      .from('user_perk_claims')
      .select('id')
      .eq('user_id', session.user_id)
      .eq('perk_type', perkType)
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

    // Calculate perk reward
    let rewardAmount = 0;
    let perkName = '';

    switch (perkType) {
      case 'daily_bonus':
        const dailyPerk = PERK_DEFINITIONS.daily_bonus;
        const vipMultiplier = userData.vip_tier ? dailyPerk.vipMultiplier[userData.vip_tier as keyof typeof dailyPerk.vipMultiplier] || 1 : 1;
        rewardAmount = Math.floor(dailyPerk.baseAmount * vipMultiplier);
        perkName = dailyPerk.name;
        break;
      case 'level_bonus':
        const levelPerk = PERK_DEFINITIONS.level_bonus;
        rewardAmount = levelPerk.baseAmount + (userData.level * levelPerk.levelMultiplier);
        perkName = levelPerk.name;
        break;
      case 'streak_bonus':
        const streakPerk = PERK_DEFINITIONS.streak_bonus;
        rewardAmount = Math.min(userData.login_streak, streakPerk.maxStreak) * streakPerk.bonusPerDay;
        perkName = streakPerk.name;
        break;
    }

    // Award the coins
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        coins: userData.coins + rewardAmount,
        last_daily_claim: perkType === 'daily_bonus' ? new Date().toISOString() : userData.last_daily_claim
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
        perk_type: perkType,
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
      perkType,
      amount: rewardAmount,
      newBalance: userData.coins + rewardAmount
    });

  } catch (error) {
    console.error('Error claiming perk:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
