import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { supabase } from '@/lib/supabase';

// System Settings API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const publicOnly = searchParams.get('public') === 'true';

    let query = supabase
      .from('system_settings')
      .select('setting_key, setting_value, setting_type, description, is_public');

    if (key) {
      query = query.eq('setting_key', key);
    }

    if (publicOnly) {
      query = query.eq('is_public', true);
    }

    const { data: settings, error } = await query;

    if (error) {
      console.error('System settings error:', error);
      return NextResponse.json({ success: true, settings: {} });
    }

    // Convert array to object
    const settingsObj = (settings || []).reduce((acc: any, setting: any) => {
      let value = setting.setting_value;
      
      // Parse value based on type
      if (setting.setting_type === 'number') {
        value = parseFloat(value);
      } else if (setting.setting_type === 'boolean') {
        value = value === 'true';
      } else if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = value;
        }
      }
      
      acc[setting.setting_key] = {
        value,
        type: setting.setting_type,
        description: setting.description,
        isPublic: setting.is_public
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      settings: settingsObj
    });

  } catch (error) {
    console.error('System settings API error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    if (!user || !['admin', 'moderator'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { key, value, type = 'string', description, isPublic = false } = await request.json();

    if (!key) {
      return NextResponse.json({ 
        error: 'Setting key is required' 
      }, { status: 400 });
    }

    // Convert value to string for storage
    let stringValue = value;
    if (type === 'json') {
      stringValue = JSON.stringify(value);
    } else if (type === 'boolean') {
      stringValue = value ? 'true' : 'false';
    } else if (type === 'number') {
      stringValue = value.toString();
    }

    const { error } = await supabase
      .from('system_settings')
      .upsert({
        setting_key: key,
        setting_value: stringValue,
        setting_type: type,
        description: description || '',
        is_public: isPublic,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Update setting error:', error);
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Setting updated successfully'
    });

  } catch (error) {
    console.error('Update setting API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
