import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getOne, run } from '@/lib/db';
import { availableCrates } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const { crateId, keyType, quantity = 1 } = await request.json();

    if (!crateId && !keyType) {
      return NextResponse.json({ error: 'Either crateId or keyType is required' }, { status: 400 });
    }

    const db = await getDb();
    
    // Get user info
    const user = getOne<{id: number}>('SELECT id FROM users WHERE email = ?', [session.email]);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = user.id;

    const results = [];

    // Give crate
    if (crateId) {
      const crate = availableCrates.find(c => c.id === crateId);
      if (!crate) {
        return NextResponse.json({ error: 'Crate not found' }, { status: 404 });
      }

      for (let i = 0; i < quantity; i++) {
        const crateInstanceId = `crate_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
        await run(`
          INSERT INTO user_crates (id, user_id, crate_id, crate_name, key_required)
          VALUES (?, ?, ?, ?, ?)
        `, [crateInstanceId, userId, crateId, crate.name, crate.key]);
        
        results.push({
          type: 'crate',
          id: crateInstanceId,
          name: crate.name,
          keyRequired: crate.key
        });
      }
    }

    // Give key
    if (keyType) {
      // Check if user already has this key type
      const existingKey = await getOne<{id: string, quantity: number}>('SELECT id, quantity FROM user_keys WHERE user_id = ? AND key_type = ?', [userId, keyType]);

      if (existingKey) {
        // Update existing key quantity
        await run('UPDATE user_keys SET quantity = quantity + ? WHERE id = ?', [quantity, existingKey.id]);
      } else {
        // Create new key entry
        const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await run(`
          INSERT INTO user_keys (id, user_id, key_type, quantity)
          VALUES (?, ?, ?, ?)
        `, [keyId, userId, keyType, quantity]);
      }
      
      results.push({
        type: 'key',
        keyType,
        quantity
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Items given successfully',
      items: results
    });

  } catch (error) {
    console.error('Give items error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}