import { NextRequest, NextResponse } from 'next/server';
import { getDb, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    await getDb();
    
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

    return NextResponse.json({ 
      success: true, 
      message: 'Featured items seeded successfully',
      count: featuredItems.length
    });

  } catch (error) {
    console.error('Error seeding featured items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
