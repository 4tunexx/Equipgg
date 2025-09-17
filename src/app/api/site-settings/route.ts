import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne, getAll } from '@/lib/db';

// GET /api/site-settings - Get public site settings (no auth required)
export async function GET(request: NextRequest) {
  try {
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
    
    const finalSettings = { ...defaultSettings, ...siteSettings };

    // Get landing settings
    const landingSettings = getOne('SELECT hero_title, hero_subtitle, featured_text, stats_text FROM landing_settings WHERE id = 1') || {
      hero_title: 'Welcome to EquipGG.net',
      hero_subtitle: 'The ultimate CS2 betting and trading platform',
      featured_text: 'Discover amazing skins and items',
      stats_text: 'Join thousands of players worldwide'
    };

    return NextResponse.json({
      siteSettings: finalSettings,
      landingSettings
    });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ 
      siteSettings: {
        logo_url: '/logo.png',
        message_of_the_day: 'Welcome to EquipGG.net!',
        betting_enabled: true,
        shop_enabled: true,
        arcade_enabled: true,
        forums_enabled: true,
        maintenance_mode: false
      },
      landingSettings: {
        hero_title: 'Welcome to EquipGG.net',
        hero_subtitle: 'The ultimate CS2 betting and trading platform',
        featured_text: 'Discover amazing skins and items',
        stats_text: 'Join thousands of players worldwide'
      }
    });
  }
}
