import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Query shop_items from Supabase
    let query = supabase
      .from('shop_items')
      .select('id, name, image_url, description, category, rarity, price, stock_quantity, item_type')
      .gt('stock_quantity', 0)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    const { data: items, error } = await query;
    if (error) {
      console.error('Error fetching shop items:', error);
      // Fallback to mock data on error
      try {
        const { shopItems } = await import('@/lib/mock-data');
        return NextResponse.json({ 
          items: shopItems,
          source: 'mock_fallback'
        });
      } catch (mockError) {
        return NextResponse.json(
          { error: 'Failed to fetch shop items' },
          { status: 500 }
        );
      }
    }
    if (!items || items.length === 0) {
      const { shopItems } = await import('@/lib/mock-data');
      return NextResponse.json({ 
        items: shopItems.slice(0, limit),
        source: 'mock'
      });
    }
    return NextResponse.json({ 
      items,
      source: 'database'
    });
    
  } catch (error) {
    console.error('Error fetching shop items:', error);
    
    // Fallback to mock data on error
    try {
      const { shopItems } = await import('@/lib/mock-data');
      return NextResponse.json({ 
        items: shopItems,
        source: 'mock_fallback'
      });
    } catch (mockError) {
      return NextResponse.json(
        { error: 'Failed to fetch shop items' },
        { status: 500 }
      );
    }
  }
}

