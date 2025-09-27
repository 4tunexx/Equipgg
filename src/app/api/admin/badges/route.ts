import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get all badges ordered by category
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('id, name, description, image_url, category, rarity, requirement_type, requirement_value')
      .order('category', { ascending: true });

    if (badgesError) {
      console.error('Error fetching badges:', badgesError);
      return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      badges: badges || []
    });

  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, rarity, requirement_type, requirement_value, image_url } = body;

    if (!name || !description || !category) {
      return NextResponse.json({ error: 'Name, description, and category are required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('badges')
      .insert([{
        name,
        description,
        category,
        rarity,
        requirement_type,
        requirement_value,
        image_url
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating badge:', error);
      return NextResponse.json({ error: 'Failed to create badge' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      badge: data
    });

  } catch (error) {
    console.error('Error creating badge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}