import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne, getAll, run } from '@/lib/db';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';

// GET /api/admin/site-control - Get site settings
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    // Ensure database is loaded
    await getDb();
    
    // Get site settings using new schema
    const settings = getAll('SELECT setting_key, setting_value FROM site_settings');
    const siteSettings: any = {};
    
    settings.forEach((row: any) => {
      const key = row.setting_key;
      const value = row.setting_value;
      
      // Convert string values to appropriate types
      if (key === 'betting_enabled' || key === 'shop_enabled' || key === 'arcade_enabled' || key === 'forums_enabled' || key === 'maintenance_mode') {
        siteSettings[key] = value === 'true';
      } else {
        siteSettings[key] = value;
      }
    });
    
    // Provide defaults if no settings found
    const defaultSettings = {
      logo_url: '/logo.png',
      message_of_the_day: 'Welcome to EquipGG.net!',
      betting_enabled: true,
      shop_enabled: true,
      arcade_enabled: true,
      forums_enabled: true,
      maintenance_mode: false
    };
    
    const finalSiteSettings = { ...defaultSettings, ...siteSettings };

    // Get flash sales
    const flashSales = getAll('SELECT id, name as title, description, discount_percentage as discount_percent, start_date as start_time, end_date as end_time, is_active as active, created_at FROM flash_sales ORDER BY created_at DESC', []);

    // Get user rewards
    const userRewards = getAll('SELECT * FROM user_rewards ORDER BY created_at DESC', []);

    // Get theme settings
    const themeSettings = getOne('SELECT * FROM theme_settings WHERE id = 1') || {
      primary_color: '#F08000',
      accent_color: '#FFB347',
      background_color: '#1A1A1A',
      custom_css: ''
    };

    // Get connection settings
    const connectionSettings = getOne('SELECT * FROM connection_settings WHERE id = 1') || {
      steam_api_key: '',
      pandascore_api_key: ''
    };

    // Get landing settings
    const landingSettings = getOne('SELECT * FROM landing_settings WHERE id = 1') || {
      hero_title: 'Welcome to EquipGG.net',
      hero_subtitle: 'The ultimate CS2 betting and trading platform',
      featured_text: 'Discover amazing skins and items',
      stats_text: 'Join thousands of players worldwide'
    };

    return NextResponse.json({
      siteSettings: finalSiteSettings,
      flashSales,
      userRewards,
      themeSettings,
      connectionSettings,
      landingSettings
    });
  } catch (error) {
    console.error('Error fetching site control data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/site-control - Update site settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const { type, data } = await request.json();
    
    if (type === 'site_settings') {
      // Update site settings using new schema
      const now = new Date().toISOString();
      const settings = [
        { key: 'logo_url', value: data.logo_url || '/logo.svg' },
        { key: 'message_of_the_day', value: data.message_of_the_day || 'Welcome to EquipGG.net!' },
        { key: 'betting_enabled', value: data.betting_enabled ? 'true' : 'false' },
        { key: 'shop_enabled', value: data.shop_enabled ? 'true' : 'false' },
        { key: 'arcade_enabled', value: data.arcade_enabled ? 'true' : 'false' },
        { key: 'forums_enabled', value: data.forums_enabled ? 'true' : 'false' },
        { key: 'maintenance_mode', value: data.maintenance_mode ? 'true' : 'false' }
      ];
      
      for (const setting of settings) {
        run(`
          INSERT OR REPLACE INTO site_settings (id, setting_key, setting_value, setting_type, description, created_at, updated_at)
          VALUES (?, ?, ?, 'string', ?, ?, ?)
        `, [
          `setting_${setting.key}`,
          setting.key,
          setting.value,
          `Site ${setting.key.replace('_', ' ')}`,
          now,
          now
        ]);
      }
    } else if (type === 'flash_sale') {
      // Create/update flash sale
      const saleId = data.id || `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (data.id) {
        run(`
          UPDATE flash_sales SET 
            name = ?, description = ?, discount_percentage = ?, 
            start_date = ?, end_date = ?, is_active = ?
          WHERE id = ?
        `, [
          data.title, data.description, data.discount_percent,
          data.start_time, data.end_time, data.active ? 1 : 0, data.id
        ]);
      } else {
        run(`
          INSERT INTO flash_sales (id, name, description, discount_percentage, start_date, end_date, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          saleId, data.title, data.description, data.discount_percent,
          data.start_time, data.end_time, data.active ? 1 : 0
        ]);
      }
    } else if (type === 'user_reward') {
      // Create/update user reward
      const rewardId = data.id || `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (data.id) {
        run(`
          UPDATE user_rewards SET 
            title = ?, description = ?, reward_type = ?, 
            reward_value = ?, required_level = ?, active = ?
          WHERE id = ?
        `, [
          data.title, data.description, data.reward_type,
          data.reward_value, data.required_level, data.active ? 1 : 0, data.id
        ]);
      } else {
        run(`
          INSERT INTO user_rewards (id, title, description, reward_type, reward_value, required_level, active)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          rewardId, data.title, data.description, data.reward_type,
          data.reward_value, data.required_level, data.active ? 1 : 0
        ]);
      }
    } else if (type === 'theme_settings') {
      // Update theme settings
      run(`
        INSERT OR REPLACE INTO theme_settings (
          id, primary_color, accent_color, background_color, custom_css
        ) VALUES (1, ?, ?, ?, ?)
      `, [
        data.primary_color,
        data.accent_color,
        data.background_color,
        data.custom_css
      ]);
    } else if (type === 'connection_settings') {
      // Update connection settings
      run(`
        INSERT OR REPLACE INTO connection_settings (
          id, steam_api_key, pandascore_api_key
        ) VALUES (1, ?, ?)
      `, [
        data.steam_api_key,
        data.pandascore_api_key
      ]);
    } else if (type === 'landing_settings') {
      // Update landing settings
      run(`
        INSERT OR REPLACE INTO landing_settings (
          id, hero_title, hero_subtitle, featured_text, stats_text
        ) VALUES (1, ?, ?, ?, ?)
      `, [
        data.hero_title,
        data.hero_subtitle,
        data.featured_text,
        data.stats_text
      ]);
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating site control:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
