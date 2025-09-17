import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse } from '@/lib/auth-utils';
import { getDb, getOne, getAll } from '@/lib/db';
import { availableCrates } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }

    const db = await getDb();
    
    // Get user info
    const user = await getOne<{id: number}>('SELECT id FROM users WHERE email = ?', [session.email]);
    
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's crates
    const crateRows = await getAll<{
      id: string,
      crate_id: string,
      crate_name: string,
      key_required: boolean,
      acquired_at: string
    }>('SELECT * FROM user_crates WHERE user_id = ? ORDER BY acquired_at DESC', [userId]);
    
    const userCrates = crateRows.map(crate => {
      const crateDetails = availableCrates.find(c => c.id === crate.crate_id);
      
      return {
        id: crate.id,
        crateId: crate.crate_id,
        name: crate.crate_name,
        keyRequired: crate.key_required,
        image: crateDetails?.image || 'https://picsum.photos/200/200?random=500',
        description: crateDetails?.description || 'A mysterious crate',
        rarityChances: crateDetails?.rarityChances || '50% Common, 25% Uncommon, 15% Rare, 8% Epic, 2% Legendary',
        xpReward: crateDetails?.xpReward || 50,
        coinReward: crateDetails?.coinReward || 100,
        acquiredAt: crate.acquired_at
      };
    });

    // Get user's keys
    const keyRows = await getAll<{
      id: string,
      key_type: string,
      quantity: number,
      acquired_at: string
    }>('SELECT * FROM user_keys WHERE user_id = ? ORDER BY acquired_at DESC', [userId]);
    
    const userKeys = keyRows.map(key => ({
      id: key.id,
      keyType: key.key_type,
      quantity: key.quantity,
      acquiredAt: key.acquired_at
    }));

    return NextResponse.json({
      success: true,
      crates: userCrates,
      keys: userKeys,
      availableCrates: availableCrates // Also return available crates for reference
    });

  } catch (error) {
    console.error('Crates fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}