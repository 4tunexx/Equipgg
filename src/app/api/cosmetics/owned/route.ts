import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthSession } from '@/lib/auth-utils';
import { PROFILE_BANNERS, getBannerById } from '@/lib/profile-banners';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Fetch user's current equipped banner
    const { data: userData } = await supabase
      .from('users')
      .select('equipped_banner')
      .eq('id', session.user_id)
      .single();

    const equippedBannerId = userData?.equipped_banner || 'banner_default';

    // Fetch user's owned cosmetics
    const { data: ownedCosmetics, error } = await supabase
      .from('user_cosmetics')
      .select('*')
      .eq('user_id', session.user_id)
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Error fetching owned cosmetics:', error);
      return NextResponse.json({ error: 'Failed to fetch cosmetics' }, { status: 500 });
    }

    // Check if default banner already exists in ownedCosmetics
    const hasDefaultBanner = ownedCosmetics?.some(c => c.cosmetic_id === 'banner_default');
    
    // Always include default banner (everyone owns it) but avoid duplicates
    const defaultBanner = getBannerById('banner_default');
    const allCosmetics = hasDefaultBanner 
      ? (ownedCosmetics || [])
      : [
          {
            id: 'default',
            user_id: session.user_id,
            cosmetic_id: 'banner_default',
            purchased_at: new Date().toISOString(),
            equipped: equippedBannerId === 'banner_default',
            ...defaultBanner,
            owned: true
          },
          ...(ownedCosmetics || [])
        ];

    // Enrich with banner data from code and deduplicate by cosmetic_id
    const cosmeticMap = new Map();
    allCosmetics.forEach(cosmetic => {
      const bannerData = getBannerById(cosmetic.cosmetic_id);
      if (bannerData && bannerData.name) {
        const key = cosmetic.cosmetic_id;
        // Keep the one that's equipped, or the first one we encounter
        if (!cosmeticMap.has(key) || cosmetic.cosmetic_id === equippedBannerId) {
          cosmeticMap.set(key, {
            ...cosmetic,
            ...bannerData,
            owned: true,
            equipped: cosmetic.cosmetic_id === equippedBannerId
          });
        }
      }
    });
    
    const enrichedCosmetics = Array.from(cosmeticMap.values());

    return NextResponse.json({
      success: true,
      cosmetics: enrichedCosmetics
    });

  } catch (error) {
    console.error('Owned cosmetics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

