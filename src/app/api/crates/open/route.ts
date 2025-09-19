import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase/client";
import { createClient } from '@supabase/supabase-js';
import { getAuthSession } from "../../../../lib/auth-utils";

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

    // Get user's balance
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('coins, gems')
      .eq('id', session.user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get crate details (using mock data for now)
    const crateData = {
      id: crateId,
      name: "Prime Crate",
      price: 100, // coins
      items: [
        { id: '1', name: 'AK-47 Redline', rarity: 'restricted', chance: 0.3, value: 50 },
        { id: '2', name: 'AWP Dragon Lore', rarity: 'covert', chance: 0.05, value: 500 },
        { id: '3', name: 'Karambit Fade', rarity: 'covert', chance: 0.02, value: 800 },
        { id: '4', name: 'M4A4 Howl', rarity: 'contraband', chance: 0.01, value: 1000 },
        { id: '5', name: 'Glock-18 Water Elemental', rarity: 'classified', chance: 0.62, value: 25 }
      ]
    };

    // Check if user has enough coins
    if (userData.coins < crateData.price) {
      return NextResponse.json({ error: "Insufficient coins" }, { status: 400 });
    }

    // Simulate crate opening with weighted random selection
    const randomValue = Math.random();
    let cumulativeChance = 0;
    let wonItem = crateData.items[crateData.items.length - 1]; // Default to most common item

    for (const item of crateData.items) {
      cumulativeChance += item.chance;
      if (randomValue <= cumulativeChance) {
        wonItem = item;
        break;
      }
    }

    // Update user balance (deduct coins, add gems equal to item value)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        coins: userData.coins - crateData.price,
        gems: (userData.gems || 0) + wonItem.value
      })
      .eq('id', session.user_id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
    }

    // Add item to user's inventory
    const { error: inventoryError } = await supabaseAdmin
      .from('user_inventory')
      .insert({
        user_id: session.user_id,
        item_id: wonItem.id,
        item_name: wonItem.name,
        item_type: 'skin',
        rarity: wonItem.rarity,
        obtained_from: 'crate_opening',
        obtained_at: new Date().toISOString()
      });

    if (inventoryError) {
      console.error('Failed to add item to inventory:', inventoryError);
      // Don't fail the entire request if inventory update fails
    }

    return NextResponse.json({
      success: true,
      crate: crateData,
      wonItem: wonItem,
      newBalance: {
        coins: userData.coins - crateData.price,
        gems: (userData.gems || 0) + wonItem.value
      }
    });

  } catch (error) {
    console.error('Error opening crate:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
