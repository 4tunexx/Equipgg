import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const displayName = String(body.displayName || '');
    const referralCode = String(body.referralCode || '').trim().toUpperCase();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // If referral code provided, verify it exists
    let referrerId = null;
    if (referralCode) {
      const { data: referrer, error: refError } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', referralCode)
        .single();

      if (refError || !referrer) {
        return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
      }
      referrerId = referrer.id;
    }

    // Use Supabase Auth for sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { displayName }
      }
    });
    
    if (error) {
      console.error('Supabase signup error:', error);
      if (error.message && error.message.toLowerCase().includes('already registered')) {
        return NextResponse.json({ error: 'User already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Registration failed - no user created' }, { status: 400 });
    }

    // Create user profile in the users table with coins (50 base + 50 if referred)
    const baseCoins = 50;
    const referralBonus = referrerId ? 50 : 0;
    const totalCoins = baseCoins + referralBonus;

    try {
      // Generate unique referral code for new user
      const newUserReferralCode = `REF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          display_name: displayName || email.split('@')[0],
          displayname: displayName || email.split('@')[0],
          username: displayName || email.split('@')[0],
          provider: 'default',
          level: 1,
          xp: 0,
          coins: totalCoins, // Grant 50-100 coins to new users
          role: 'user',
          account_status: 'active',
          email_verified: false,
          steam_verified: false,
          referral_code: newUserReferralCode,
          referred_by: referrerId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail registration if profile creation fails
      }

      // If user was referred, reward the referrer
      if (referrerId) {
        await supabase.rpc('increment_user_coins', {
          p_user_id: referrerId,
          p_amount: 50
        });

        // Create notification for referrer
        await supabase.from('notifications').insert({
          user_id: referrerId,
          type: 'referral_reward',
          title: '🎉 Referral Reward!',
          message: `${displayName} used your referral code! You earned 50 coins!`,
          read: false,
          created_at: new Date().toISOString()
        });

        // Create notification for new user
        await supabase.from('notifications').insert({
          user_id: data.user.id,
          type: 'referral_bonus',
          title: '🎁 Welcome Bonus!',
          message: `You earned 50 bonus coins from referral code ${referralCode}!`,
          read: false,
          created_at: new Date().toISOString()
        });
      }
    } catch (profileErr) {
      console.error('Profile creation exception:', profileErr);
    }

    // Check if email confirmation is required in Supabase settings
    // If user is confirmed immediately (no email verification), sign them in
    if (data.session && data.user.email_confirmed_at) {
      console.log('Registration successful with immediate session (email confirmed)');
      
      // Set the session cookie same way as login
      const sessionData = JSON.stringify({
        user_id: data.user.id,
        email: data.user.email,
        role: 'user',
        displayName: displayName || email.split('@')[0],
        avatarUrl: '',
        level: 1,
        xp: 0,
        provider: 'default',
        steamVerified: false,
        expires_at: Date.now() + (60 * 60 * 24 * 7 * 1000) // 7 days
      });
      
      const response = NextResponse.json({ 
        ok: true, 
        user: {
          id: data.user.id,
          email: data.user.email,
          displayName: displayName || email.split('@')[0],
          provider: 'default',
          level: 1,
          xp: 0,
          role: 'user',
          account_status: 'active'
        },
        session: data.session 
      });
      
      // Set httpOnly cookie for server auth reading
      response.cookies.set("equipgg_session", sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      // Set client-readable cookie for AuthProvider
      response.cookies.set("equipgg_session_client", sessionData, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
      
      return response;
    } else {
      // Email verification required - redirect to dashboard with notification
      return NextResponse.json({ 
        ok: true, 
        message: 'Registration successful! Please check your email to verify your account.',
        user: data.user,
        emailVerificationRequired: true,
        redirectToDashboard: true // Signal frontend to redirect anyway
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


