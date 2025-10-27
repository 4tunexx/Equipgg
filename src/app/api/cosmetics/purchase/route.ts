import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthSession } from '@/lib/auth-utils';
import { getBannerById } from '@/lib/profile-banners';
import { createNotification } from '@/lib/notification-utils';
import { checkBalanceAccess, createVerificationNotification } from '@/lib/verification-check';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cosmeticId } = await request.json();

    if (!cosmeticId) {
      return NextResponse.json({ error: 'Cosmetic ID required' }, { status: 400 });
    }

    // Get banner details
    const banner = getBannerById(cosmeticId);
    if (!banner) {
      return NextResponse.json({ error: 'Invalid cosmetic ID' }, { status: 400 });
    }

    // Check verification status first - ANTI-CHEAT
    const verificationStatus = await checkBalanceAccess(session.user_id);
    if (!verificationStatus.canUseBalances) {
      // Create notification for user
      const notificationType = verificationStatus.requiresEmailVerification ? 'email' : 'steam';
      await createVerificationNotification(session.user_id, notificationType);
      
      return NextResponse.json({ 
        error: verificationStatus.message || 'Account verification required',
        requiresVerification: true,
        notificationCreated: true
      }, { status: 403 });
    }

    const supabase = createServerSupabaseClient();

    // Check if already owned
    const { data: existing } = await supabase
      .from('user_cosmetics')
      .select('id')
      .eq('user_id', session.user_id)
      .eq('cosmetic_id', cosmeticId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'You already own this cosmetic' }, { status: 400 });
    }

    // Check user balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('coins')
      .eq('id', session.user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    if (userData.coins < banner.price) {
      return NextResponse.json(
        { error: `Insufficient coins. You need ${banner.price} coins but have ${userData.coins}.` },
        { status: 400 }
      );
    }

    // Deduct coins
    const { error: deductError } = await supabase
      .from('users')
      .update({ coins: userData.coins - banner.price })
      .eq('id', session.user_id);

    if (deductError) {
      console.error('Error deducting coins:', deductError);
      return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
    }

    // Add to user_cosmetics
    const { error: insertError } = await supabase
      .from('user_cosmetics')
      .insert({
        user_id: session.user_id,
        cosmetic_id: cosmeticId,
        cosmetic_type: 'banner',
        purchased_at: new Date().toISOString(),
        equipped: false
      });

    if (insertError) {
      console.error('Error adding cosmetic:', insertError);
      
      // Refund coins
      await supabase
        .from('users')
        .update({ coins: userData.coins })
        .eq('id', session.user_id);

      return NextResponse.json({ error: 'Failed to add cosmetic' }, { status: 500 });
    }

    // Create notification
    await createNotification({
      userId: session.user_id,
      type: 'cosmetic_purchased',
      title: '🎨 Cosmetic Purchased!',
      message: `You purchased ${banner.name} for ${banner.price} coins! Equip it in your profile settings.`,
      data: { cosmeticId, name: banner.name, price: banner.price }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${banner.name}!`,
      cosmetic: {
        ...banner,
        owned: true
      },
      newBalance: userData.coins - banner.price
    });

  } catch (error) {
    console.error('Purchase cosmetic API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

