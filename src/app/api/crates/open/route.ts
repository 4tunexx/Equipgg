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

    const { crateId, crateName } = await request.json();
    
    if (!crateId) {
      return NextResponse.json({ error: "Crate ID is required" }, { status: 400 });
    }

    // Check if user has keys for this crate
    const keysResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/user/crate-keys`, {
      headers: {
        'Cookie': `equipgg_session=${JSON.stringify({
          user_id: session.user_id,
          email: session.email,
          role: session.role
        })}`
      }
    });

    if (!keysResponse.ok) {
      return NextResponse.json({ error: "Failed to check keys" }, { status: 500 });
    }

    const keysData = await keysResponse.json();
    const userKeys = keysData.keys || {};

    if ((userKeys[crateId] || 0) <= 0) {
      return NextResponse.json({ error: "No keys available for this crate" }, { status: 400 });
    }

    // Get crate details from database
    const { data: crateData, error: crateError } = await supabaseAdmin
      .from('crates')
      .select('*')
      .eq('id', crateId)
      .single();

    if (crateError || !crateData) {
      console.log('Crate not found in database, using mock data for crate:', crateId);
      // Use mock crate data for development
      const mockCrates = {
        '1': { name: 'Starter Crate', price: 0 },
        '2': { name: 'Bronze Crate', price: 0 },
        '3': { name: 'Silver Crate', price: 0 },
        '4': { name: 'Gold Crate', price: 0 },
        '5': { name: 'Platinum Crate', price: 0 }
      };
      
      const mockCrate = mockCrates[crateId as keyof typeof mockCrates] || { name: crateName || 'Unknown Crate', price: 0 };
      
      // Mock items for the crate
      const mockItems = [
        { id: '1', name: 'AK-47 Redline', rarity: 'restricted', chance: 0.3, value: 50 },
        { id: '2', name: 'AWP Dragon Lore', rarity: 'covert', chance: 0.05, value: 500 },
        { id: '3', name: 'Karambit Fade', rarity: 'covert', chance: 0.02, value: 800 },
        { id: '4', name: 'M4A4 Howl', rarity: 'contraband', chance: 0.01, value: 1000 },
        { id: '5', name: 'Glock-18 Water Elemental', rarity: 'classified', chance: 0.62, value: 25 }
      ];

      // Simulate crate opening with weighted random selection
      const randomValue = Math.random();
      let cumulativeChance = 0;
      let wonItem = mockItems[mockItems.length - 1]; // Default to most common item

      for (const item of mockItems) {
        cumulativeChance += item.chance;
        if (randomValue <= cumulativeChance) {
          wonItem = item;
          break;
        }
      }

      // Consume the key
      const consumeResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/user/crate-keys`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `equipgg_session=${JSON.stringify({
            user_id: session.user_id,
            email: session.email,
            role: session.role
          })}`
        },
        body: JSON.stringify({ crateId })
      });

      if (!consumeResponse.ok) {
        console.warn('Failed to consume key, but continuing with mock opening');
      }

      // Add item to user's inventory (if table exists)
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

      if (inventoryError && inventoryError.code !== 'PGRST116') {
        console.error('Failed to add item to inventory:', inventoryError);
      }

      return NextResponse.json({
        success: true,
        crate: {
          id: crateId,
          name: mockCrate.name,
          opened_at: new Date().toISOString()
        },
        wonItem: {
          id: wonItem.id,
          name: wonItem.name,
          rarity: wonItem.rarity,
          type: 'skin',
          value: wonItem.value,
          image: '/assets/placeholder.svg'
        },
        coinReward: wonItem.value,
        xpReward: 50
      });
    }

    // Real crate opening logic would go here when database is fully set up
    // For now, return success with mock data
    return NextResponse.json({
      success: true,
      crate: crateData,
      wonItem: {
        id: '1',
        name: 'Sample Item',
        rarity: 'common',
        type: 'skin',
        value: 100,
        image: '/assets/placeholder.svg'
      },
      coinReward: 100,
      xpReward: 50
    });

  } catch (error) {
    console.error('Error opening crate:', error);
    return NextResponse.json({
      error: "Failed to open crate",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
