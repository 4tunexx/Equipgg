import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get flash sale items from Supabase
    const { data, error } = await supabase
      .from('flash_sales')
      .select(`
        *,
        items (*)
      `)
      .eq('active', true)
      .gte('end_time', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      // If table doesn't exist, return mock flash sale data
      if (error.code === '42P01') {
        return NextResponse.json([
          {
            id: '1',
            item_id: '1',
            original_price: 50.00,
            sale_price: 35.00,
            discount_percent: 30,
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            active: true,
            items: {
              id: '1',
              name: 'AK-47 | Redline',
              type: 'rifle',
              rarity: 'classified',
              image: '/assets/weapons/ak47-redline.png'
            }
          },
          {
            id: '2',
            item_id: '2', 
            original_price: 25.00,
            sale_price: 18.75,
            discount_percent: 25,
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
            active: true,
            items: {
              id: '2',
              name: 'M4A4 | Howl',
              type: 'rifle',
              rarity: 'contraband',
              image: '/assets/weapons/m4a4-howl.png'
            }
          }
        ]);
      }
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching flash sales:', error);
    return NextResponse.json({ 
      error: "Unable to fetch flash sales" 
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
