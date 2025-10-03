import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get flash sale items with proper join
    const { data, error } = await supabase
      .from('flash_sales')
      .select(`
        *,
        items (*)
      `)
      .eq('active', true)
      .gte('end_time', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching flash sales:', error);
      
      // If table doesn't exist, return empty array
      if (error.code === '42P01' || error.code === 'PGRST116') {
        return NextResponse.json([]);
      }
      
      // Try without join for backwards compatibility
      const { data: simpleData, error: simpleError } = await supabase
        .from('flash_sales')
        .select('*')
        .eq('active', true)
        .gte('end_time', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(6);
        
      if (simpleError) {
        return NextResponse.json([]);
      }
      
      return NextResponse.json(simpleData || []);
    }

    // Return the data (empty array if no flash sales)
    return NextResponse.json(data || []);
    
  } catch (error) {
    console.error('Error fetching flash sales:', error);
    
    // Return empty array on error to encourage proper data setup
    return NextResponse.json([]);
  }
}export async function POST(request: NextRequest) {
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
