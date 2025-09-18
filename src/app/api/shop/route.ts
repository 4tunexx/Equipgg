import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSupabaseQueries } from '@/lib/supabase/queries';

const queries = createSupabaseQueries(supabase);

export async function GET(request: NextRequest) {
  try {
    const items = await queries.getShopItems();
    
    return NextResponse.json({ 
      items,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching shop items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, itemId } = await request.json();
    
    if (!userId || !itemId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const item = await queries.purchaseShopItem(userId, itemId);
    
    return NextResponse.json({ 
      success: true,
      item
    });
  } catch (error: any) {
    console.error('Error purchasing shop item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to purchase item' },
      { status: 500 }
    );
  }
}

