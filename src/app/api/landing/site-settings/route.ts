import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { getAuthSession } from "../../../../lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    // Get site settings from database
    const { data: settings, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    // Convert to key-value pairs for easier frontend usage
    const settingsObj = settings?.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>) || {};

    return NextResponse.json({ settings: settingsObj });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ error: 'Failed to fetch site settings' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const authSession = await getAuthSession(request);
    if (!authSession || authSession.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { key, value, description } = await request.json();
    
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }
    
    // Insert or update setting
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({
        key,
        value,
        description: description || null,
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ setting: data });
  } catch (error) {
    console.error('Error creating/updating site setting:', error);
    return NextResponse.json({ error: 'Failed to create/update site setting' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authSession = await getAuthSession(request);
    if (!authSession || authSession.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { settings } = await request.json();
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 });
    }
    
    // Batch update multiple settings
    const settingsArray = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      is_active: true,
      updated_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabase
      .from('site_settings')
      .upsert(settingsArray, { onConflict: 'key' })
      .select();
    
    if (error) throw error;
    
    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ error: 'Failed to update site settings' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authSession = await getAuthSession(request);
    if (!authSession || authSession.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ error: 'Key parameter is required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('site_settings')
      .update({ is_active: false })
      .eq('key', key);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting site setting:', error);
    return NextResponse.json({ error: 'Failed to delete site setting' }, { status: 500 });
  }
}