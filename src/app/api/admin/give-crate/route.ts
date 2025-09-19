import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { crateId, userId, quantity = 1 } = await request.json();

    if (!crateId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Give crate to user using RPC function
    const { data, error } = await supabase.rpc('give_crate', {
      p_crate_id: crateId,
      p_user_id: userId,
      p_quantity: quantity
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully gave ${quantity} crate(s) to user`
    });

  } catch (error) {
    console.error('Error giving crate:', error);
    return NextResponse.json(
      { error: 'Failed to give crate' },
      { status: 500 }
    );
  }
}