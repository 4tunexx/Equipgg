import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get site settings from Supabase
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      // If table doesn't exist, return default settings
      if (error.code === '42P01') {
        return NextResponse.json({
          siteName: 'EquipGG',
          siteDescription: 'The Ultimate CS2 Virtual Betting & Gaming Platform',
          enableRegistration: true,
          maintenanceMode: false,
          enableChat: true,
          enableBetting: true,
          enableCrates: true,
          enableTradeUp: true,
          minimumWithdrawal: 5,
          maximumBet: 1000,
          steamApiKey: process.env.STEAM_API_KEY || '',
          pandascore_api_key: process.env.PANDASCORE_API_KEY || ''
        });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ 
      error: "Unable to fetch site settings" 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json();
    
    const { data, error } = await supabase
      .from('site_settings')
      .upsert(settings)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ 
      error: "Unable to update site settings" 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request); // Alias PUT to POST
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ 
    error: "Site settings cannot be deleted" 
  }, { status: 405 });
}
