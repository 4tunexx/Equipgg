import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase/client";
import { createClient } from '@supabase/supabase-js';
import { getAuthSession } from "../../../../lib/auth-utils";
import { addXpForCrateOpened } from "../../../../lib/xp-leveling-system";
import { trackMissionProgress } from "../../../../lib/mission-integration";
import { createNotification } from "../../../../lib/notification-utils";

// Create Supabase admin client for secure operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { crateId } = await request.json();
    
    if (!crateId) {
      return NextResponse.json({ error: "Crate ID is required" }, { status: 400 });
    }

    // Use the database function to open the crate (handles key check, item selection, and inventory addition)
    const { data: wonItemData, error: openError } = await supabaseAdmin
      .rpc('open_crate', {
        p_user_id: session.user_id,
        p_crate_id: crateId
      })
      .single() as { 
        data: {
          won_item_id: string;
          won_item_name: string;
          won_item_type: string;
          won_item_rarity: string;
          won_item_image: string;
        } | null;
        error: any;
      };

    if (openError) {
      console.error('Error opening crate:', openError);
      return NextResponse.json({ 
        error: openError.message || "Failed to open crate. Make sure you have keys."
      }, { status: 400 });
    }

    if (!wonItemData) {
      return NextResponse.json({ error: "No item won" }, { status: 500 });
    }

    // Get crate details for rewards info
    const { data: crateData } = await supabaseAdmin
      .from('crates')
      .select('*')
      .eq('id', crateId)
      .single();

    // Get full inventory item details with joined item data
    const { data: inventoryItem } = await supabaseAdmin
      .from('user_inventory')
      .select('*, item:items(*)')
      .eq('user_id', session.user_id)
      .eq('item_id', wonItemData.won_item_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Award XP, track missions, and check achievements (non-blocking)
    try {
      await addXpForCrateOpened(session.user_id, wonItemData.won_item_rarity);
      await trackMissionProgress(session.user_id, 'crate_opened', 1);
      
      // Track crate opening achievements
      const { trackCrateOpening } = await import('../../../../lib/crate-achievements');
      await trackCrateOpening(session.user_id, wonItemData.won_item_rarity);
      
      // Create notification for item received
      await createNotification({
        userId: session.user_id,
        type: 'item_received',
        title: '🎁 New Item!',
        message: `${wonItemData.won_item_name} (${wonItemData.won_item_rarity}) added to your inventory!`,
        data: {
          itemId: wonItemData.won_item_id,
          itemName: wonItemData.won_item_name,
          rarity: wonItemData.won_item_rarity
        }
      });
    } catch (xpError) {
      console.warn('Failed to award XP/notification for crate opening:', xpError);
    }

    // Log activity to activity feed (non-blocking)
    try {
      const { logActivity } = await import('../../../../lib/activity-logger');
      
      // Get username for activity feed
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('username')
        .eq('id', session.user_id)
        .single();
      
      await logActivity({
        userId: session.user_id,
        username: userData?.username || 'Player',
        activityType: 'crate_open',
        itemName: wonItemData.won_item_name,
        itemRarity: wonItemData.won_item_rarity as any,
        activityData: {
          crateId: crateId,
          crateName: crateData?.name,
          crateType: crateData?.type
        }
      });
    } catch (activityError) {
      console.warn('Failed to log crate opening activity:', activityError);
    }

    return NextResponse.json({
      success: true,
      crate: {
        id: crateId,
        name: crateData?.name || 'Crate',
        opened_at: new Date().toISOString()
      },
      wonItem: inventoryItem || {
        id: wonItemData.won_item_id,
        item: {
          id: wonItemData.won_item_id,
          name: wonItemData.won_item_name,
          type: wonItemData.won_item_type,
          rarity: wonItemData.won_item_rarity,
          image: wonItemData.won_item_image
        }
      },
      coinReward: crateData?.coin_reward || 100,
      xpReward: crateData?.xp_reward || 50
    });

  } catch (error) {
    console.error('Error opening crate:', error);
    return NextResponse.json({
      error: "Failed to open crate",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
