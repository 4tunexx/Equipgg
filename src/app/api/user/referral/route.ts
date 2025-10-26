import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthSession } from '@/lib/auth-utils';
import { createNotification } from '@/lib/notification-utils';

// Generate unique referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'REF-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET - Get user's referral code and referred users
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Get or create user's referral code
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('referral_code, referred_by')
      .eq('id', session.user_id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    let referralCode = userData?.referral_code;

    // If user doesn't have a referral code, generate one
    if (!referralCode) {
      referralCode = generateReferralCode();
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ referral_code: referralCode })
        .eq('id', session.user_id);

      if (updateError) {
        console.error('Error updating referral code:', updateError);
      }
    }

    // Get list of users who used this user's referral code
    const { data: referredUsers, error: referredError } = await supabase
      .from('users')
      .select('id, username, displayname, created_at')
      .eq('referred_by', referralCode);

    if (referredError) {
      console.error('Error fetching referred users:', referredError);
    }

    return NextResponse.json({
      success: true,
      referralCode,
      referredBy: userData?.referred_by,
      referredUsers: referredUsers || [],
      totalReferrals: referredUsers?.length || 0
    });

  } catch (error) {
    console.error('Referral GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Apply a referral code (for new users)
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { referralCode } = await request.json();

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Check if user already used a referral code
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('referred_by, referral_code')
      .eq('id', session.user_id)
      .single();

    if (currentUserError) {
      console.error('Error fetching current user:', currentUserError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (currentUser?.referred_by) {
      return NextResponse.json(
        { error: 'You have already used a referral code' },
        { status: 400 }
      );
    }

    // Check if user is trying to use their own referral code
    if (currentUser?.referral_code === referralCode) {
      return NextResponse.json(
        { error: 'You cannot use your own referral code' },
        { status: 400 }
      );
    }

    // Find the user who owns this referral code
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('id, username, displayname')
      .eq('referral_code', referralCode)
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    // Update current user's referred_by
    const { error: updateError } = await supabase
      .from('users')
      .update({ referred_by: referralCode })
      .eq('id', session.user_id);

    if (updateError) {
      console.error('Error updating referred_by:', updateError);
      return NextResponse.json({ error: 'Failed to apply referral code' }, { status: 500 });
    }

    const REFERRAL_REWARD = 50;

    // Award coins to both users
    await Promise.all([
      // Reward the referrer
      supabase.rpc('increment_user_coins', {
        p_user_id: referrer.id,
        p_amount: REFERRAL_REWARD
      }),
      // Reward the new user
      supabase.rpc('increment_user_coins', {
        p_user_id: session.user_id,
        p_amount: REFERRAL_REWARD
      })
    ]);

    // Send notifications
    await Promise.all([
      createNotification({
        userId: referrer.id,
        type: 'referral_success',
        title: '🎉 Referral Reward!',
        message: `You earned ${REFERRAL_REWARD} coins for referring a new user!`,
        data: { coins: REFERRAL_REWARD }
      }),
      createNotification({
        userId: session.user_id,
        type: 'referral_used',
        title: '🎁 Welcome Bonus!',
        message: `You earned ${REFERRAL_REWARD} coins using ${referrer.displayname || referrer.username}'s referral code!`,
        data: { coins: REFERRAL_REWARD }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: `Referral code applied! You and ${referrer.displayname || referrer.username} each earned ${REFERRAL_REWARD} coins!`,
      reward: REFERRAL_REWARD
    });

  } catch (error) {
    console.error('Referral POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

