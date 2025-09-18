import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';
import { createSupabaseQueries } from '@/lib/supabase/queries';

const queries = createSupabaseQueries(supabase);

export async function POST(request: NextRequest) {
  try {
    // Get user session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId, itemId, quantity = 1 } = await request.json();

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: 'User ID and item ID are required' },
        { status: 400 }
      );
    }

    // Add items to user's inventory
    const promises = [];
    for (let i = 0; i < quantity; i++) {
      promises.push(queries.addItemToInventory(userId, itemId));
    }

    const items = await Promise.all(promises);
    
    return NextResponse.json({ 
      success: true,
      items,
      message: `Successfully gave ${quantity} item(s) to user`
    });

  } catch (error) {
    console.error('Error giving items:', error);
    return NextResponse.json(
      { error: 'Failed to give items' },
      { status: 500 }
    );
  }
}
