import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getAll, getOne, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    await getDb();
    
    const settings = await getAll(`
      SELECT * FROM site_settings 
      ORDER BY setting_key ASC
    `);

    // Convert to key-value object
    const settingsObject: Record<string, any> = {};
    settings.forEach((setting: any) => {
      let value = setting.setting_value;
      
      // Parse based on type
      if (setting.setting_type === 'number') {
        value = parseFloat(value) || 0;
      } else if (setting.setting_type === 'boolean') {
        value = value === 'true';
      } else if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch {
          value = value;
        }
      }
      
      settingsObject[setting.setting_key] = value;
    });

    return NextResponse.json(settingsObject);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await getOne('SELECT role FROM users WHERE id = ?', [session.user_id]);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await getDb();
    const body = await request.json();
    
    const { setting_key, setting_value, setting_type, description } = body;
    
    if (!setting_key || setting_value === undefined) {
      return NextResponse.json(
        { error: 'Setting key and value are required' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Convert value to string for storage
    let stringValue = setting_value;
    if (typeof setting_value === 'object') {
      stringValue = JSON.stringify(setting_value);
    } else {
      stringValue = String(setting_value);
    }
    
    run(`
      INSERT OR REPLACE INTO site_settings (id, setting_key, setting_value, setting_type, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, setting_key, stringValue, setting_type || 'string', description, now, now]);

    return NextResponse.json({ 
      success: true, 
      message: 'Site setting updated successfully' 
    });

  } catch (error) {
    console.error('Error updating site setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await getOne('SELECT role FROM users WHERE id = ?', [session.user_id]);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await getDb();
    const body = await request.json();
    
    const { setting_key, setting_value, setting_type, description } = body;
    
    if (!setting_key || setting_value === undefined) {
      return NextResponse.json(
        { error: 'Setting key and value are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    
    // Convert value to string for storage
    let stringValue = setting_value;
    if (typeof setting_value === 'object') {
      stringValue = JSON.stringify(setting_value);
    } else {
      stringValue = String(setting_value);
    }
    
    run(`
      UPDATE site_settings 
      SET setting_value = ?, setting_type = ?, description = ?, updated_at = ?
      WHERE setting_key = ?
    `, [stringValue, setting_type || 'string', description, now, setting_key]);

    return NextResponse.json({ 
      success: true, 
      message: 'Site setting updated successfully' 
    });

  } catch (error) {
    console.error('Error updating site setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
