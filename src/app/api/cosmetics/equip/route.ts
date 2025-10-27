import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthSession } from '@/lib/auth-utils';
import { getBannerById } from '@/lib/profile-banners';

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

    const supabase = createServerSupabaseClient();

    // Verify user owns this cosmetic (or it's the free default)
    if (cosmeticId !== 'banner_default') {
      const { data: owned, error: ownError } = await supabase
        .from('user_cosmetics')
        .select('id')
        .eq('user_id', session.user_id)
        .eq('cosmetic_id', cosmeticId)
        .single();

      if (ownError || !owned) {
        return NextResponse.json({ error: 'You do not own this cosmetic' }, { status: 403 });
      }
    }

    // Update equipped_banner in users table
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ equipped_banner: cosmeticId })
      .eq('id', session.user_id);

    if (updateUserError) {
      console.error('Error updating equipped banner:', updateUserError);
      return NextResponse.json({ error: 'Failed to equip cosmetic' }, { status: 500 });
    }

    // Update user_cosmetics: set all to not equipped, then this one to equipped
    await supabase
      .from('user_cosmetics')
      .update({ equipped: false })
      .eq('user_id', session.user_id);

    await supabase
      .from('user_cosmetics')
      .update({ equipped: true })
      .eq('user_id', session.user_id)
      .eq('cosmetic_id', cosmeticId);

    return NextResponse.json({
      success: true,
      message: `${banner.name} equipped successfully!`,
      equippedBanner: cosmeticId
    });

  } catch (error) {
    console.error('Equip cosmetic API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

