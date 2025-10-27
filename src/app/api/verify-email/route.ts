import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { createNotification } from '@/lib/notification-utils';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Find the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_confirmation_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      // Delete expired token
      await supabase
        .from('email_confirmation_tokens')
        .delete()
        .eq('token', token);

      return NextResponse.json(
        { error: 'Verification link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if already used
    if (tokenData.used) {
      return NextResponse.json(
        { error: 'This verification link has already been used.' },
        { status: 400 }
      );
    }

    const REWARD_COINS = 10;

    // Mark email as confirmed
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_confirmed: true,
        email_confirmed_at: new Date().toISOString(),
        email: tokenData.email // Update to the confirmed email
      })
      .eq('id', tokenData.user_id);

    if (updateError) {
      console.error('Error confirming email:', updateError);
      return NextResponse.json(
        { error: 'Failed to confirm email' },
        { status: 500 }
      );
    }

    // Award coins
    await supabase.rpc('increment_user_coins', {
      p_user_id: tokenData.user_id,
      p_amount: REWARD_COINS
    });

    // Mark token as used
    await supabase
      .from('email_confirmation_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('token', token);

    // Create success notification
    await createNotification({
      userId: tokenData.user_id,
      type: 'email_confirmed',
      title: '✅ Email Verified!',
      message: `Your email has been confirmed! You've earned ${REWARD_COINS} coins as a reward. Welcome to the community!`,
      data: { coins: REWARD_COINS, email: tokenData.email }
    });

    console.log(`✅ Email verified for user ${tokenData.user_id}, awarded ${REWARD_COINS} coins`);

    return NextResponse.json({
      success: true,
      message: `Email successfully verified! You've earned ${REWARD_COINS} coins!`,
      reward: REWARD_COINS
    });

  } catch (error) {
    console.error('Email verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

