import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase/client";
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthSession } from "../../../lib/auth-utils";
import { trackMissionProgress, updateOwnershipMissions } from "../../../lib/mission-integration";

// Supabase admin client is created inside handlers when needed via createServerSupabaseClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { itemIds } = await request.json();
    
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length !== 10) {
      return NextResponse.json({ error: "Exactly 10 items required for trade-up" }, { status: 400 });
    }

    // Mock trade-up logic since this is a complex feature
    // In a real implementation, you would:
    // 1. Verify user owns all items
    // 2. Check items are same rarity and eligible
    // 3. Calculate probabilities for next tier items
    // 4. Remove input items and add result item

    const tradeUpItems = [
      { id: '1', name: 'AK-47 Redline', rarity: 'classified', tier: 4 },
      { id: '2', name: 'M4A4 Asiimov', rarity: 'classified', tier: 4 },
      { id: '3', name: 'AWP Lightning Strike', rarity: 'classified', tier: 4 }
    ];

    // Simulate random selection for result
    const resultItem = tradeUpItems[Math.floor(Math.random() * tradeUpItems.length)];

    // Mock outcome - in real implementation this would be provably fair
    const tradeUpResult = {
      id: Math.random().toString(36).substr(2, 9),
      name: resultItem.name,
      rarity: 'covert', // Next tier up
      value: 150, // Mock value
      obtained_from: 'trade_up_contract'
    };

    // Track mission progress and update ownership-based missions
    try {
      await trackMissionProgress(session.user_id, 'trade_up', 1);
      await updateOwnershipMissions(session.user_id);
    } catch (e) {
      console.warn('Trade-up mission/ownership tracking failed (non-fatal):', e);
    }

    // In a real implementation, update user inventory
    // For now, just return the result
    return NextResponse.json({
      success: true,
      result: tradeUpResult,
      inputItems: itemIds,
      message: "Trade-up contract completed successfully"
    });

  } catch (error) {
    console.error('Error processing trade-up:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Return available items for trade-up (mock data)
    const availableItems = [
      { id: '1', name: 'AK-47 Blue Laminate', rarity: 'restricted', owned: 3 },
      { id: '2', name: 'M4A1-S Bright Water', rarity: 'restricted', owned: 5 },
      { id: '3', name: 'P90 Trigon', rarity: 'restricted', owned: 2 },
      { id: '4', name: 'UMP-45 Blaze', rarity: 'restricted', owned: 4 }
    ];

    return NextResponse.json({
      success: true,
      availableItems: availableItems,
      rules: {
        requiredItems: 10,
        mustBeSameRarity: true,
        resultTier: 'next_rarity_tier'
      }
    });

  } catch (error) {
    console.error('Error fetching trade-up items:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
