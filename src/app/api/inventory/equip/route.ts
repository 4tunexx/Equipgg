import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabase";

const validSlots = ['primary', 'secondary', 'knife', 'gloves', 'agent'] as const;
type SlotType = typeof validSlots[number];

interface EquipRequest {
  itemId: string;
  slot: SlotType;
}

const slotMapping: Record<SlotType, string[]> = {
  'primary': ['Rifle', 'SMG', 'Heavy'],
  'secondary': ['Pistol'],
  'knife': ['Knife'],
  'gloves': ['Gloves'],
  'agent': ['Operator']
};

export async function POST(request: NextRequest) {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
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
      .eq('user_id', session.user.id)
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
      p_user_id: session.user.id,
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