import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get featured items from Supabase
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('featured', true)
      .order('rarity_value', { ascending: false })
      .limit(8);

    if (error) {
      // If table doesn't exist or no featured items, return mock data
      if (error.code === '42P01' || !data || data.length === 0) {
        return NextResponse.json([
          {
            id: '1',
            name: 'AK-47 | Redline',
            type: 'rifle',
            rarity: 'classified',
            price: 45.32,
            image: '/assets/weapons/ak47-redline.png',
            featured: true
          },
          {
            id: '2', 
            name: 'AWP | Dragon Lore',
            type: 'sniper',
            rarity: 'covert',
            price: 2750.00,
            image: '/assets/weapons/awp-dragonlore.png',
            featured: true
          },
          {
            id: '3',
            name: 'Karambit | Fade',
            type: 'knife',
            rarity: 'covert',
            price: 1200.50,
            image: '/assets/weapons/karambit-fade.png',
            featured: true
          }
        ]);
      }
      throw error;
    }

    return NextResponse.json(data);
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
