import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get featured items from Supabase
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('featured', true)
      .order('rarity_value', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Error fetching featured items:', error);
      
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json([]);
      }
      
      // For other errors, return empty array
      return NextResponse.json([]);
    }

    // Return data (empty array if no featured items)
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching featured items:', error);
    return NextResponse.json({ 
      error: "Unable to fetch featured items" 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: "Method not allowed" 
  }, { status: 405 });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ 
    error: "Method not allowed" 
  }, { status: 405 });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ 
    error: "Method not allowed" 
  }, { status: 405 });
}
