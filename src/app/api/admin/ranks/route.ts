import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get all ranks ordered by xp_required
    const { data: ranks, error: ranksError } = await supabase
      .from('ranks')
      .select('id, name, xp_required as min_xp, level_required as tier, icon_url as image_url')
      .order('xp_required', { ascending: true });

    if (ranksError) {
      console.error('Error fetching ranks:', ranksError);
      return NextResponse.json({ error: 'Failed to fetch ranks' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ranks: ranks || []
    });

  } catch (error) {
    console.error('Error fetching ranks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, min_xp, max_xp, tier, image_url } = body;

    if (!name || min_xp === undefined) {
      return NextResponse.json({ error: 'Name and min_xp are required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('ranks')
      .insert([{
        name,
        min_xp,
        max_xp,
        tier,
        image_url
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating rank:', error);
      return NextResponse.json({ error: 'Failed to create rank' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rank: data
    });

  } catch (error) {
    console.error('Error creating rank:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}