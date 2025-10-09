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

    // Normalize to UI shape expected by admin page
    const normalized = (ranks || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      tier: r.tier,
      min_xp: r.min_level,    // map min_level -> min_xp
      max_xp: r.max_level,    // map max_level -> max_xp
      image_url: r.icon_url,  // map icon_url -> image_url
      rank_number: r.rank_number,
      prestige_icon_url: r.prestige_icon_url
    }));

    return NextResponse.json({ success: true, ranks: normalized });

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
    // Accept UI-style fields and map to DB columns
    const {
      rank_number,
      name,
      tier,
      min_xp,
      max_xp,
      image_url,
      prestige_icon_url,
      // Also accept DB-style fields just in case
      min_level,
      max_level,
      icon_url,
    } = body;

    const minLevel = min_level !== undefined ? min_level : min_xp;
    const maxLevel = max_level !== undefined ? max_level : max_xp;
    const iconUrl = icon_url || image_url;

    if (!name || tier === undefined || minLevel === undefined) {
      return NextResponse.json({ error: 'Name, tier, and min_xp (min_level) are required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('ranks')
      .insert([{
        id: rank_number?.toString() || Date.now().toString(),
        rank_number,
        name,
        tier,
        min_level: minLevel,
        max_level: maxLevel,
        icon_url: iconUrl,
        prestige_icon_url
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating rank:', error);
      return NextResponse.json({ error: 'Failed to create rank' }, { status: 500 });
    }

    // Normalize response to UI shape
    const normalized = data && {
      id: data.id,
      name: data.name,
      tier: data.tier,
      min_xp: data.min_level,
      max_xp: data.max_level,
      image_url: data.icon_url,
      rank_number: data.rank_number,
    };

    return NextResponse.json({ success: true, rank: normalized });

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
        min_level: min_xp,
        max_level: max_xp,
        tier,
        icon_url: image_url
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating rank:', error);
      return NextResponse.json({ error: 'Failed to update rank' }, { status: 500 });
    }

    const normalized = data && {
      id: data.id,
      name: data.name,
      tier: data.tier,
      min_xp: data.min_level,
      max_xp: data.max_level,
      image_url: data.icon_url,
      rank_number: data.rank_number,
    };

    return NextResponse.json({ success: true, rank: normalized });

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