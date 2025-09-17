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

    return NextResponse.json({ 
      success: true, 
      message: 'Flash sales seeded successfully',
      count: flashSales.length
    });

  } catch (error) {
    console.error('Error seeding flash sales:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
