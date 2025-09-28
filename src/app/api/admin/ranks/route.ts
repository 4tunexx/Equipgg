import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get all ranks ordered by rank_number
    const { data: ranks, error: ranksError } = await supabase
      .from('ranks')
      .select('id, rank_number, name, tier, min_level, max_level, icon_url, prestige_icon_url')
      .order('rank_number', { ascending: true });

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
    const { rank_number, name, tier, min_level, max_level, icon_url, prestige_icon_url } = body;

    if (!name || !tier || min_level === undefined || max_level === undefined) {
      return NextResponse.json({ error: 'Name, tier, min_level, and max_level are required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('ranks')
      .insert([{
        id: rank_number?.toString() || Date.now().toString(),
        rank_number,
        name,
        tier,
        min_level,
        max_level,
        icon_url,
        prestige_icon_url
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, min_xp, max_xp, tier, image_url } = body;

    if (!id) {
      return NextResponse.json({ error: 'Rank ID is required' }, { status: 400 });
    }

    if (!name || min_xp === undefined) {
      return NextResponse.json({ error: 'Name and min_xp are required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('ranks')
      .update({
        name,
        min_xp,
        max_xp,
        tier,
        image_url
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating rank:', error);
      return NextResponse.json({ error: 'Failed to update rank' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rank: data
    });

  } catch (error) {
    console.error('Error updating rank:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Rank ID is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('ranks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting rank:', error);
      return NextResponse.json({ error: 'Failed to delete rank' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Rank deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting rank:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}