import { NextRequest, NextResponse } from 'next/server';
import { secureDb } from "../../../lib/secure-db";

// PUBLIC API - Returns items from items table (not shop_items)
export async function GET(request: NextRequest) {
  try {
    // Get all items from the items table - SAME as admin but no auth required
    let rawItems = await secureDb.findMany('items', {}, { orderBy: 'created_at DESC' });

    // Normalize to UI shape expected by pages
    const items = (rawItems || []).map((it: any) => ({
      id: it.id,
      name: it.name,
      type: it.type,
      rarity: it.rarity,
      value: it.coin_price || it.value || 0,
      image: it.image, // items table uses 'image' column
      image_url: it.image, // also provide as image_url for compatibility
      created_at: it.created_at,
      description: it.description,
      category: it.category,
      weapon_type: it.weapon_type,
      is_equipable: it.is_equipable,
      for_crate: it.for_crate,
      featured: it.featured
    }));

    return NextResponse.json({ success: true, items });

  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
