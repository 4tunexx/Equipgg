import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSupabaseQueries } from '@/lib/supabase/queries';

const queries = createSupabaseQueries(supabase);

export async function GET(request: NextRequest) {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get all crates with items and rarity chances
    const crates = await queries.getAllCrates();
    
    // Get crate items with rarity chances
    const cratesWithItems = await Promise.all(
      crates.map(async (crate) => {
        const items = await queries.getCrateItems(crate.id);
        return {
          ...crate,
          items: items.map(item => ({
            ...item.item,
            dropChance: item.drop_chance
          }))
        };
      })
    );
    
    return NextResponse.json({ crates: cratesWithItems });
  } catch (error) {
    console.error('Error getting crates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crates' },
      { status: 500 }
    );
  }
}

// POST /api/crates - Open a crate
export async function POST(request: NextRequest) {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { crateId } = await request.json();
    
    if (!crateId) {
      return NextResponse.json(
        { error: 'Missing crate ID' },
        { status: 400 }
      );
    }

    // Open crate using RPC function
    const { data: itemId, error: openError } = await supabase.rpc('open_crate', {
      p_user_id: session.user.id,
      p_crate_id: crateId
    });

    if (openError) {
      return NextResponse.json(
        { error: openError.message || 'Failed to open crate' },
        { status: 400 }
      );
    }

    // Get the won item details
    const item = await queries.getItemById(itemId);
    
    // Get all possible items for animation
    const crateItems = await queries.getCrateItems(crateId);
    const allItems = crateItems.map(ci => ci.item).filter(Boolean);

    return NextResponse.json({
      success: true,
      wonItem: item,
      allItems
    });
  } catch (error) {
    console.error('Error opening crate:', error);
    return NextResponse.json(
      { error: 'Failed to open crate' },
      { status: 500 }
    );
  }
}