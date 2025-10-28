import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthSession } from '@/lib/auth-utils';
import { createNotification } from '@/lib/notification-utils';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json().catch(() => ({}));
    const { newEmail } = body;

    // Check if email is already confirmed
    let { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('email_confirmed, email, provider, displayname, username')
      .eq('id', session.user_id)
      .single();

    if (fetchError) {
      console.error('Error fetching user data:', fetchError);
      // If user doesn't exist in users table, create it
      if (fetchError.code === 'PGRST116') {
        console.log('User not found in users table, creating user record...');
        
        // Get user info from Supabase Auth
        const { data: authUser } = await supabase.auth.admin.getUserById(session.user_id);
        
        if (!authUser?.user) {
          return NextResponse.json({
            success: false,
            error: 'User not found in authentication system'
          }, { status: 404 });
        }
        
        // Create user record in users table
        const { error: createError } = await supabase
          .from('users')
          .insert({
            id: session.user_id,
            email: authUser.user.email || '',
            displayname: authUser.user.user_metadata?.displayName || authUser.user.email?.split('@')[0] || 'User',
            username: authUser.user.user_metadata?.displayName || authUser.user.email?.split('@')[0] || 'User',
            provider: 'default',
            level: 1,
            xp: 0,
            coins: 50,
            gems: 0,
            role: 'user',
            account_status: 'active',
            email_verified: false,
            steam_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (createError) {
          console.error('Error creating user record:', createError);
          return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
        }
        
        // Fetch the newly created user
        const { data: newUserData, error: newUserError } = await supabase
          .from('users')
          .select('email_confirmed, email, provider, displayname, username')
          .eq('id', session.user_id)
          .single();
        
        if (newUserError || !newUserData) {
          return NextResponse.json({ error: 'Failed to fetch created user' }, { status: 500 });
        }
        
        // Continue with the confirmation process
        userData = newUserData;
      } else {
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
    }

    if (userData.email_confirmed && !userData.email.includes('@steam.local')) {
      return NextResponse.json(
        { error: 'Email already confirmed' },
        { status: 400 }
      );
    }

    let emailToConfirm = userData.email;

    // For Steam users or users with @steam.local emails, update to the new email
    if (newEmail && (userData.provider === 'steam' || userData.email.includes('@steam.local'))) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Check if email is already in use by another user
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', newEmail)
        .neq('id', session.user_id)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use by another account' },
          { status: 400 }
        );
      }

      // Update email first
      const { error: emailUpdateError } = await supabase
        .from('users')
        .update({ email: newEmail })
        .eq('id', session.user_id);

      if (emailUpdateError) {
        console.error('Error updating email:', emailUpdateError);
        return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
      }

      emailToConfirm = newEmail;
    }

    // Generate confirmation token (valid for 24 hours)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in database
    await supabase
      .from('email_confirmation_tokens')
      .upsert({
        user_id: session.user_id,
        token,
        email: emailToConfirm,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    // Create confirmation URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    const confirmationUrl = `${baseUrl}/verify-email?token=${token}`;

    // Send confirmation email
    try {
      const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailToConfirm,
          subject: '✅ Confirm Your Email - Earn 10 Coins!',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
                .reward { background: #fff; border: 2px solid #ffd700; border-radius: 10px; padding: 15px; text-align: center; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎮 Email Confirmation</h1>
                </div>
                <div class="content">
                  <h2>Hey ${userData.displayname || userData.username || 'there'}! 👋</h2>
                  <p>Thanks for joining us! We're excited to have you on board.</p>
                  
                  <div class="reward">
                    <h3>🎁 Special Reward!</h3>
                    <p>Confirm your email and get <strong>10 coins</strong> instantly!</p>
                  </div>

                  <p>Click the button below to confirm your email address:</p>
                  
                  <div style="text-align: center;">
                    <a href="${confirmationUrl}" class="button">
                      ✅ Confirm Email & Claim Reward
                    </a>
                  </div>

                  <p><strong>Note:</strong> This link will expire in 24 hours.</p>

                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

                  <p style="font-size: 12px; color: #777;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${confirmationUrl}" style="color: #667eea; word-break: break-all;">${confirmationUrl}</a>
                  </p>

                  <p style="font-size: 12px; color: #777;">
                    If you didn't create an account, you can safely ignore this email.
                  </p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Equip.gg - All rights reserved</p>
                  <p>This is an automated email. Please do not reply.</p>
                </div>
              </div>
            </body>
            </html>
          `
        })
      });

      if (!emailResponse.ok) {
        console.error('Email send failed:', await emailResponse.text());
        throw new Error('Failed to send email');
      }

      console.log('✅ Confirmation email sent to:', emailToConfirm);

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails, but log it
      return NextResponse.json({
        success: true,
        message: 'Confirmation token generated, but email sending failed. Please contact support.',
        emailSent: false
      });
    }

    // Create notification
    await createNotification({
      userId: session.user_id,
      type: 'email_confirmation_sent',
      title: '📧 Confirmation Email Sent!',
      message: `Check your inbox at ${emailToConfirm} and click the confirmation link to earn 10 coins!`,
      data: { email: emailToConfirm }
    });

    return NextResponse.json({
      success: true,
      message: newEmail
        ? `Confirmation email sent to ${emailToConfirm}! Check your inbox and click the link to earn 10 coins.`
        : `Confirmation email sent! Check your inbox and click the link to earn 10 coins.`,
      emailSent: true,
      email: emailToConfirm
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

    // Cross-check Supabase Auth in case our users table isn't updated yet
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(session.user_id);
      if (authUser?.user?.email_confirmed_at && !data?.email_confirmed) {
        await supabase
          .from('users')
          .update({ email_confirmed: true })
          .eq('id', session.user_id);
        if (data) (data as any).email_confirmed = true;
      }
    } catch (e) {
      console.warn('Email confirmation cross-check failed:', e);
    }

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
