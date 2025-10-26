import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthSession } from '@/lib/auth-utils';
import { createNotification } from '@/lib/notification-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Check if email is already confirmed
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('email_confirmed, email')
      .eq('id', session.user_id)
      .single();

    if (fetchError) {
      console.error('Error fetching user data:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (userData.email_confirmed) {
      return NextResponse.json(
        { error: 'Email already confirmed' },
        { status: 400 }
      );
    }

    // Mark email as confirmed
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_confirmed: true,
        email_confirmed_at: new Date().toISOString()
      })
      .eq('id', session.user_id);

    if (updateError) {
      console.error('Error confirming email:', updateError);
      return NextResponse.json({ error: 'Failed to confirm email' }, { status: 500 });
    }

    const REWARD_COINS = 10;

    // Award 10 coins
    await supabase.rpc('increment_user_coins', {
      p_user_id: session.user_id,
      p_amount: REWARD_COINS
    });

    // Create notification
    await createNotification({
      userId: session.user_id,
      type: 'email_confirmed',
      title: '✅ Email Confirmed!',
      message: `Thank you for confirming your email! You've earned ${REWARD_COINS} coins as a reward.`,
      data: { coins: REWARD_COINS }
    });

    return NextResponse.json({
      success: true,
      message: `Email confirmed! You've earned ${REWARD_COINS} coins!`,
      reward: REWARD_COINS
    });

  } catch (error) {
    console.error('Email confirmation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Check email confirmation status
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('users')
      .select('email_confirmed, email, provider')
      .eq('id', session.user_id)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      emailConfirmed: data.email_confirmed || false,
      email: data.email,
      provider: data.provider
    });

  } catch (error) {
    console.error('Email confirmation check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

