import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";

const validSlots = ['perk', 'weapon', 'knife', 'gloves', 'agent'] as const;
type SlotType = typeof validSlots[number];

interface EquipRequest {
  itemId: string;
  slot: SlotType;
}

const slotMapping: Record<SlotType, string[]> = {
  'perk': ['Perk', 'perk'],
  'weapon': ['Rifle', 'SMG', 'Heavy', 'Pistol'],
  'knife': ['Knife'],
  'gloves': ['Gloves'],
  'agent': ['Operator', 'Agent']
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Try to get user from custom session cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/equipgg_session=([^;]+)/);
    
    let userId: string | null = null;
    
    if (cookieMatch) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(cookieMatch[1]));
        if (sessionData.user_id && (!sessionData.expires_at || Date.now() < sessionData.expires_at)) {
          userId = sessionData.user_id;
        }
      } catch (e) {
        console.error('Failed to parse session cookie:', e);
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { itemId, slot } = await request.json() as EquipRequest;

    if (!itemId || !slot) {
      return NextResponse.json(
        { error: 'Item ID and slot are required' },
        { status: 400 }
      );
    }

    // Check if slot is valid
    if (!validSlots.includes(slot)) {
      return NextResponse.json(
        { error: 'Invalid slot' },
        { status: 400 }
      );
    }

    // Get item details to verify type
    const { data: inventoryItem, error: findError } = await supabase
      .from('user_inventory')
      .select('*, item:items(*)')
      .eq('id', itemId)
      .eq('user_id', userId)
      .single();

    if (findError || !inventoryItem) {
      console.error('Error finding inventory item:', findError);
      return NextResponse.json(
        { error: 'Item not found in inventory' },
        { status: 404 }
      );
    }

    // Check if item type matches slot
    const allowedTypes = slotMapping[slot];
    if (!allowedTypes || !allowedTypes.includes(inventoryItem.item.type)) {
      return NextResponse.json({ 
        error: `${inventoryItem.item.type} items cannot be equipped to ${slot} slot` 
      }, { status: 400 });
    }

    // Start transaction to update equipped items
    const { data: equippedItem, error: equipError } = await supabase.rpc('equip_inventory_item', {
      p_user_id: userId,
      p_item_id: itemId,
      p_slot: slot
    });

    if (equipError) {
      console.error('Error equipping item:', equipError);
      return NextResponse.json(
        { error: 'Failed to equip item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${inventoryItem.item.name} equipped to ${slot} slot`,
      equippedItem
    });

  } catch (error) {
    console.error('Equip item error:', error);
    return NextResponse.json(
      { error: 'Failed to equip item' },
      { status: 500 }
    );
  }
}