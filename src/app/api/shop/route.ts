import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAll } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    await getDb();
    
    let query = `
      SELECT id, name, image_url, description, category, rarity, price, stock_quantity, item_type
      FROM shop_items
      WHERE stock_quantity > 0
    `;
    
    const params: (string | number)[] = [];
    
    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    const items = await getAll(query, params);
    
    // If no items found in database, return mock data as fallback
    if (items.length === 0) {
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

