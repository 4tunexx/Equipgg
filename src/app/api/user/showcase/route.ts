import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthSession } from '@/lib/auth-utils';

// GET - Fetch user's showcase settings
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Get user's showcase settings
    const { data: showcase, error } = await supabase
      .from('user_showcase')
      .select('*')
      .eq('user_id', session.user_id)
      .maybeSingle();
    
    // If showcase exists, fetch related data separately
    let showcaseData = showcase;
    if (showcase) {
      // Fetch achievement if exists
      if (showcase.achievement_id) {
        const { data: achievement } = await supabase
          .from('achievements')
          .select('id, name, icon_url, description')
          .eq('id', showcase.achievement_id)
          .single();
        showcaseData = { ...showcaseData, achievements: achievement };
      }
      
      // Fetch items if they exist
      const itemIds = [showcase.item_id_1, showcase.item_id_2, showcase.item_id_3].filter(Boolean);
      if (itemIds.length > 0) {
        const { data: items } = await supabase
          .from('items')
          .select('id, name, image, rarity, coin_price')
          .in('id', itemIds);
        
        if (items) {
          showcaseData = {
            ...showcaseData,
            items_1: items.find(i => i.id === showcase.item_id_1) || null,
            items_2: items.find(i => i.id === showcase.item_id_2) || null,
            items_3: items.find(i => i.id === showcase.item_id_3) || null
          };
        }
      }
    }

    // Handle different error cases
    if (error) {
      console.error('Error fetching showcase:', error);
      
      // If table doesn't exist or no record found, return empty data
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return NextResponse.json({
          success: true,
          showcase: {
            achievement_id: null,
            item_id_1: null,
            item_id_2: null,
            item_id_3: null
          }
        });
      }
      
      // For other errors, return empty showcase instead of error
      return NextResponse.json({
        success: true,
        showcase: {
          achievement_id: null,
          item_id_1: null,
          item_id_2: null,
          item_id_3: null
        }
      });
    }

    return NextResponse.json({
      success: true,
      showcase: showcaseData || {
        achievement_id: null,
        item_id_1: null,
        item_id_2: null,
        item_id_3: null
      }
    });

  } catch (error) {
    console.error('Showcase fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update user's showcase settings
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { achievement_id, item_id_1, item_id_2, item_id_3 } = body;

    const supabase = createServerSupabaseClient();

    // Verify user owns the selected achievement if provided
    if (achievement_id) {
      const { data: userAchievement } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', session.user_id)
        .eq('achievement_id', achievement_id)
        .eq('unlocked', true)
        .single();

      if (!userAchievement) {
        return NextResponse.json(
          { error: 'You have not unlocked this achievement' },
          { status: 400 }
        );
      }
    }

    // Verify user owns the selected items if provided
    const itemIds = [item_id_1, item_id_2, item_id_3].filter(Boolean);
    if (itemIds.length > 0) {
      const { data: userItems } = await supabase
        .from('user_inventory')
        .select('item_id')
        .eq('user_id', session.user_id)
        .in('item_id', itemIds);

      if (!userItems || userItems.length !== itemIds.length) {
        return NextResponse.json(
          { error: 'You do not own all selected items' },
          { status: 400 }
        );
      }
    }

    // Upsert showcase settings
    const { error: upsertError } = await supabase
      .from('user_showcase')
      .upsert({
        user_id: session.user_id,
        achievement_id: achievement_id || null,
        item_id_1: item_id_1 || null,
        item_id_2: item_id_2 || null,
        item_id_3: item_id_3 || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Error saving showcase:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save showcase settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Showcase settings saved successfully!'
    });

  } catch (error) {
    console.error('Showcase save error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

