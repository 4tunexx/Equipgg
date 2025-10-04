import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    const { data: perks, error } = await supabase
      .from('perks')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching perks:', error);
      return NextResponse.json({ error: 'Failed to fetch perks' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      perks: perks || [],
      total_count: perks?.length || 0
    });

  } catch (error) {
    console.error('Error in perks admin API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const perkData = await request.json();
    
    const { data: newPerk, error } = await supabase
      .from('perks')
      .insert([{
        name: perkData.name,
        description: perkData.description,
        category: perkData.category,
        perk_type: perkData.perk_type,
        effect_value: perkData.effect_value || 0,
        duration_hours: perkData.duration_hours || 0,
        coin_price: perkData.coin_price || 0,
        gem_price: perkData.gem_price || 0,
        is_consumable: perkData.is_consumable !== undefined ? perkData.is_consumable : true,
        is_active: perkData.is_active !== undefined ? perkData.is_active : true
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating perk:', error);
      return NextResponse.json({ error: 'Failed to create perk' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Perk created successfully',
      perk: newPerk
    });

  } catch (error) {
    console.error('Admin perks POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const perkId = searchParams.get('id');
    const perkData = await request.json();

    if (!perkId) {
      return NextResponse.json({ error: 'Perk ID is required' }, { status: 400 });
    }

    const { data: updatedPerk, error } = await supabase
      .from('perks')
      .update({
        name: perkData.name,
        description: perkData.description,
        category: perkData.category,
        perk_type: perkData.perk_type,
        effect_value: perkData.effect_value,
        duration_hours: perkData.duration_hours,
        coin_price: perkData.coin_price,
        gem_price: perkData.gem_price,
        is_consumable: perkData.is_consumable,
        is_active: perkData.is_active
      })
      .eq('id', perkId)
      .select()
      .single();

    if (error) {
      console.error('Error updating perk:', error);
      return NextResponse.json({ error: 'Failed to update perk' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Perk updated successfully',
      perk: updatedPerk
    });

  } catch (error) {
    console.error('Admin perks PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const perkId = searchParams.get('id');

    if (!perkId) {
      return NextResponse.json({ error: 'Perk ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('perks')
      .delete()
      .eq('id', perkId);

    if (error) {
      console.error('Error deleting perk:', error);
      return NextResponse.json({ error: 'Failed to delete perk' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Perk deleted successfully'
    });

  } catch (error) {
    console.error('Admin perks DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
