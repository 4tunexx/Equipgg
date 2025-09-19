import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const perkType = searchParams.get('perk_type');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('perks')
      .select(`
        id,
        name,
        description,
        category,
        perk_type,
        effect_value,
        duration_hours,
        coin_price,
        gem_price,
        is_active,
        created_at,
        updated_at
      `)
      .order('category', { ascending: true })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (perkType && perkType !== 'all') {
      query = query.eq('perk_type', perkType);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: perks, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch perks' },
        { status: 500 }
      );
    }

    // Get perk statistics
    const { data: stats } = await supabase
      .from('perks')
      .select('category, perk_type')
      .eq('is_active', true);

    const categoryStats = stats?.reduce((acc, perk) => {
      acc[perk.category] = (acc[perk.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const typeStats = stats?.reduce((acc, perk) => {
      acc[perk.perk_type] = (acc[perk.perk_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return NextResponse.json({
      perks: perks || [],
      total: count || 0,
      stats: {
        categories: categoryStats,
        types: typeStats
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      perk_type,
      effect_value,
      duration_hours,
      coin_price,
      gem_price,
      is_active = true
    } = body;

    // Validate required fields
    if (!name || !description || !category || !perk_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('perks')
      .insert([{
        name,
        description,
        category,
        perk_type,
        effect_value: parseFloat(effect_value) || 0,
        duration_hours: parseInt(duration_hours) || 0,
        coin_price: parseInt(coin_price) || 0,
        gem_price: parseInt(gem_price) || 0,
        is_active
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create perk' },
        { status: 500 }
      );
    }

    return NextResponse.json({ perk: data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Perk ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('perks')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update perk' },
        { status: 500 }
      );
    }

    return NextResponse.json({ perk: data });

  } catch (error) {
    console.error('API error:', error);
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
      return NextResponse.json(
        { error: 'Perk ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('perks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete perk' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}