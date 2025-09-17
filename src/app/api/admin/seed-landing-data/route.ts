import { NextRequest, NextResponse } from 'next/server';
import { getDb, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    await getDb();
    
    // Seed flash sales
    const flashSales = [
      {
        id: uuidv4(),
        name: 'Summer Special',
        description: 'Get amazing discounts on all premium items and perks!',
        discount_percentage: 25,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        is_active: true
      },
      {
        id: uuidv4(),
        name: 'New Year Sale',
        description: 'Start the year with incredible savings!',
        discount_percentage: 30,
        start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
        is_active: false
      }
    ];

    for (const sale of flashSales) {
      run(`
        INSERT OR REPLACE INTO flash_sales (id, name, description, discount_percentage, start_date, end_date, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sale.id,
        sale.name,
        sale.description,
        sale.discount_percentage,
        sale.start_date,
        sale.end_date,
        sale.is_active,
        new Date().toISOString(),
        new Date().toISOString()
      ]);
    }

    // Seed featured items
    const featuredItems = [
      {
        id: uuidv4(),
        name: 'AK-47 Redline',
        description: 'A legendary weapon skin with striking red accents',
        image_url: 'https://picsum.photos/300/200?random=1',
        item_type: 'Weapon',
        rarity: 'Classified',
        price: 2500,
        sort_order: 1,
        is_active: true
      },
      {
        id: uuidv4(),
        name: 'AWP Dragon Lore',
        description: 'The most coveted sniper rifle in the game',
        image_url: 'https://picsum.photos/300/200?random=2',
        item_type: 'Weapon',
        rarity: 'Covert',
        price: 5000,
        sort_order: 2,
        is_active: true
      },
      {
        id: uuidv4(),
        name: 'Karambit Fade',
        description: 'A beautiful knife with a stunning fade pattern',
        image_url: 'https://picsum.photos/300/200?random=3',
        item_type: 'Knife',
        rarity: 'Covert',
        price: 8000,
        sort_order: 3,
        is_active: true
      },
      {
        id: uuidv4(),
        name: 'M4A4 Howl',
        description: 'A rare and powerful assault rifle',
        image_url: 'https://picsum.photos/300/200?random=4',
        item_type: 'Weapon',
        rarity: 'Covert',
        price: 3500,
        sort_order: 4,
        is_active: true
      }
    ];

    for (const item of featuredItems) {
      run(`
        INSERT OR REPLACE INTO featured_items (id, name, description, image_url, item_type, rarity, price, sort_order, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        item.id,
        item.name,
        item.description,
        item.image_url,
        item.item_type,
        item.rarity,
        item.price,
        item.sort_order,
        item.is_active,
        new Date().toISOString(),
        new Date().toISOString()
      ]);
    }

    // Seed site settings
    const siteSettings = [
      {
        id: uuidv4(),
        setting_key: 'site_title',
        setting_value: 'EquipGG - CS2 Betting Platform',
        setting_type: 'string',
        description: 'Main site title displayed in browser and headers'
      },
      {
        id: uuidv4(),
        setting_key: 'site_description',
        setting_value: 'The ultimate CS2 betting and trading platform with real rewards',
        setting_type: 'string',
        description: 'Site description for SEO and social sharing'
      },
      {
        id: uuidv4(),
        setting_key: 'maintenance_mode',
        setting_value: 'false',
        setting_type: 'boolean',
        description: 'Enable or disable maintenance mode'
      },
      {
        id: uuidv4(),
        setting_key: 'max_daily_bets',
        setting_value: '100',
        setting_type: 'number',
        description: 'Maximum number of bets a user can place per day'
      }
    ];

    for (const setting of siteSettings) {
      run(`
        INSERT OR REPLACE INTO site_settings (id, setting_key, setting_value, setting_type, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        setting.id,
        setting.setting_key,
        setting.setting_value,
        setting.setting_type,
        setting.description,
        new Date().toISOString(),
        new Date().toISOString()
      ]);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Landing page data seeded successfully',
      data: {
        flashSales: flashSales.length,
        featuredItems: featuredItems.length,
        siteSettings: siteSettings.length
      }
    });

  } catch (error) {
    console.error('Error seeding landing page data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
