import 'server-only';
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

// ANTI-CHEAT: Track ongoing crate openings to prevent duplicate requests
const ongoingOpens = new Map<string, number>();
const OPEN_COOLDOWN = 2000; // 2 second cooldown between opens per user
const REQUEST_TIMEOUT = 10000; // 10 second timeout for stuck requests

export async function POST(request: NextRequest) {
  // Declare these at function scope so they're accessible in catch block
  let userKey: string | undefined;
  let timeoutId: NodeJS.Timeout | undefined;
  
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { crateId } = await request.json();
    
    if (!crateId) {
      return NextResponse.json({ error: "Crate ID is required" }, { status: 400 });
    }

    // ANTI-CHEAT: Check if user is already opening a crate
    userKey = `${session.user_id}:${crateId}`;
    const now = Date.now();
    const lastOpen = ongoingOpens.get(userKey);
    
    if (lastOpen) {
      const timeSinceLastOpen = now - lastOpen;
      if (timeSinceLastOpen < OPEN_COOLDOWN) {
        console.warn(`⚠️ ANTI-CHEAT: User ${session.user_id} tried to open crate too quickly (${timeSinceLastOpen}ms)`);
        return NextResponse.json({ 
          error: "Please wait before opening another crate.",
          cooldown: Math.ceil((OPEN_COOLDOWN - timeSinceLastOpen) / 1000)
        }, { status: 429 });
      }
    }
    
    // Mark this request as ongoing
    ongoingOpens.set(userKey, now);
    console.log(`🔒 ANTI-CHEAT: Locked crate opening for user ${session.user_id}`);
    
    // Set timeout to auto-clear if request gets stuck
    timeoutId = setTimeout(() => {
      if (userKey) ongoingOpens.delete(userKey);
      console.log(`⏰ ANTI-CHEAT: Auto-cleared stuck request for user ${session.user_id}`);
    }, REQUEST_TIMEOUT);

    // Use the database function to open the crate (handles key check, item selection, and inventory addition)
    console.log(`🎲 Attempting to open crate ${crateId} for user ${session.user_id}`);
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
      console.error('❌ Error opening crate:', openError);
      // Clear the lock on error
      clearTimeout(timeoutId);
      ongoingOpens.delete(userKey);
      console.log(`🔓 ANTI-CHEAT: Unlocked due to error`);
      
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
      console.log('🎯 Starting post-crate rewards for user:', session.user_id);
      
      await addXpForCrateOpened(session.user_id, wonItemData.won_item_rarity);
      console.log('✅ XP awarded');
      
      console.log('🚀 ABOUT TO CALL trackMissionProgress with:', { userId: session.user_id, action: 'crate_opened', value: 1 });
      await trackMissionProgress(session.user_id, 'crate_opened', 1);
      console.log('✅ Mission progress tracked');
      
      // Track crate opening achievements
      const { trackCrateOpening } = await import('../../../../lib/crate-achievements');
      await trackCrateOpening(session.user_id, wonItemData.won_item_rarity);
      console.log('✅ Achievement tracked');
      
      // Create notification for item received
      console.log('📣 CREATING ITEM NOTIFICATION - START');
      console.log('🔔 Creating notification for user:', session.user_id);
      console.log('📦 Item data:', { 
        id: wonItemData.won_item_id,
        name: wonItemData.won_item_name,
        rarity: wonItemData.won_item_rarity
      });
      
      try {
        // Force Supabase admin client for reliable notification creation
        await supabaseAdmin
          .from('notifications')
          .insert({
            id: crypto.randomUUID(),
            user_id: session.user_id,
            type: 'item_received',
            title: '🎁 New Item!',
            message: `${wonItemData.won_item_name} (${wonItemData.won_item_rarity}) added to your inventory!`,
            data: JSON.stringify({
              itemId: wonItemData.won_item_id,
              itemName: wonItemData.won_item_name,
              rarity: wonItemData.won_item_rarity,
              linkTo: '/dashboard/inventory'
            }),
            read: false,
            created_at: new Date().toISOString()
          });
            
        console.log('✅ Direct notification created successfully');
        
        // Also use the utility function (backup)
        await createNotification({
          userId: session.user_id,
          type: 'item_received',
          title: '🎁 New Item!',
          message: `${wonItemData.won_item_name} (${wonItemData.won_item_rarity}) added to your inventory!`,
          data: {
            itemId: wonItemData.won_item_id,
            itemName: wonItemData.won_item_name,
            rarity: wonItemData.won_item_rarity,
            linkTo: '/dashboard/inventory'
          }
        });
        
        console.log('📣 NOTIFICATION CREATION COMPLETE');
      } catch (notificationError) {
        console.error('❌ NOTIFICATION ERROR:', notificationError);
        // Still continue with other operations
      }
    } catch (xpError) {
      console.error('❌ Failed to award XP/notification for crate opening:', xpError);
    }

    // Log activity to activity feed (non-blocking)
    try {
      console.log('📊 Logging activity to feed...');
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
      console.log('✅ Activity logged to feed');
    } catch (activityError) {
      console.error('❌ Failed to log crate opening activity:', activityError);
    }

    // CRITICAL FIX: Return the item data in a consistent structure
    // that exactly matches what the front-end expects
    const wonItemResult = {
      id: wonItemData.won_item_id,
      name: wonItemData.won_item_name,
      type: wonItemData.won_item_type,
      rarity: wonItemData.won_item_rarity,
      image: wonItemData.won_item_image
    };
    
    console.log('💡 FINAL ITEM RETURNED:', wonItemResult);
    
    // ANTI-CHEAT: Clear the lock and timeout on success
    clearTimeout(timeoutId);
    console.log(`✅ ANTI-CHEAT: Crate opened successfully, cooldown active for ${OPEN_COOLDOWN}ms`);
    
    return NextResponse.json({
      success: true,
      crate: {
        id: crateId,
        name: crateData?.name || 'Crate',
        opened_at: new Date().toISOString()
      },
      wonItem: wonItemResult,
      coinReward: crateData?.coin_reward || 100,
      xpReward: crateData?.xp_reward || 50
    });

  } catch (error) {
    console.error('💥 Error opening crate:', error);
    
    // ANTI-CHEAT: Clear lock on error
    if (timeoutId) clearTimeout(timeoutId);
    if (userKey) ongoingOpens.delete(userKey);
    console.log(`🔓 ANTI-CHEAT: Unlocked due to error`);
    
    return NextResponse.json({
      error: "Failed to open crate",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
