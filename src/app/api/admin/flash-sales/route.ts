import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get all flash sales with item details
    const { data, error } = await supabase
      .from('flash_sales')
      .select(`
        *,
        items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Flash sales error:', error);
      // If table doesn't exist, return empty array
      if (error.code === '42P01' || error.code === 'PGRST116') {
        return NextResponse.json([]);
      }
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching flash sales:', error);
    // Return empty array instead of error for graceful fallback
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const flashSale = await request.json();
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('flash_sales')
      .insert([{
        item_id: flashSale.item_id,
        original_price: flashSale.original_price,
        sale_price: flashSale.sale_price,
        discount_percent: flashSale.discount_percent,
        start_time: flashSale.start_time,
        end_time: flashSale.end_time,
        active: flashSale.active
      }])
      .select(`
        *,
        items (*)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating flash sale:', error);
    return NextResponse.json({ error: "Unable to create flash sale" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('flash_sales')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        items (*)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating flash sale:', error);
    return NextResponse.json({ error: "Unable to update flash sale" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Flash sale ID required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from('flash_sales')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting flash sale:', error);
    return NextResponse.json({ error: "Unable to delete flash sale" }, { status: 500 });
  }
}