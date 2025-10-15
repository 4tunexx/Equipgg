import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get items from the items table - same as shop
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (itemsError) {
      console.error('Error fetching featured items:', itemsError);
      return NextResponse.json([]);
    }

    // Return items in the SAME format as shop API
    const formattedItems = (items || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || `${item.type} weapon`,
      price: item.coin_price || 0,
      type: item.type,
      rarity: item.rarity,
      image: item.image, // This is the key field!
      is_active: item.is_active,
      featured: item.featured
    }));

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error('Error fetching featured items:', error);
    return NextResponse.json({ 
      error: "Unable to fetch featured items" 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: "Method not allowed" 
  }, { status: 405 });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ 
    error: "Method not allowed" 
  }, { status: 405 });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ 
    error: "Method not allowed" 
  }, { status: 405 });
}
