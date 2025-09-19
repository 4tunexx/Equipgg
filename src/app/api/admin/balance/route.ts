import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../../lib/auth-utils";
import { supabase } from "../../../../lib/supabase/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('coins, gems')
      .eq('id', session.user_id)
      .single();

    if (error) {
      console.error('Error fetching admin balance:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      coins: user.coins,
      gems: user.gems
    });
  } catch (error) {
    console.error('Error fetching admin balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { coins, gems } = await request.json();

    if (typeof coins !== 'number' || typeof gems !== 'number') {
      return NextResponse.json({ error: 'Invalid coins or gems value' }, { status: 400 });
    }

    if (coins < 0 || gems < 0) {
      return NextResponse.json({ error: 'Coins and gems cannot be negative' }, { status: 400 });
    }

    const { error } = await supabase
      .from('users')
      .update({ coins, gems })
      .eq('id', session.user_id);

    if (error) {
      console.error('Error updating admin balance:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Balance updated successfully',
      coins,
      gems
    });
  } catch (error) {
    console.error('Error updating admin balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
