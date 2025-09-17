import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getOne, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// CS2 Skin inventory with gem prices
const CS2_SKINS = {
  knives: [
    { id: 'karambit_fade', name: 'Karambit | Fade', rarity: 'Legendary', gems: 5000, steamMarketPrice: 1200 },
    { id: 'butterfly_fade', name: 'Butterfly Knife | Fade', rarity: 'Legendary', gems: 4500, steamMarketPrice: 1100 },
    { id: 'm9_bayonet_doppler', name: 'M9 Bayonet | Doppler', rarity: 'Legendary', gems: 4000, steamMarketPrice: 900 },
    { id: 'bayonet_tiger', name: 'Bayonet | Tiger Tooth', rarity: 'Legendary', gems: 3500, steamMarketPrice: 800 },
    { id: 'flip_marble', name: 'Flip Knife | Marble Fade', rarity: 'Legendary', gems: 3000, steamMarketPrice: 700 }
  ],
  gloves: [
    { id: 'sport_gloves_pandora', name: 'Sport Gloves | Pandora\'s Box', rarity: 'Legendary', gems: 4000, steamMarketPrice: 1000 },
    { id: 'hand_wraps_slaughter', name: 'Hand Wraps | Slaughter', rarity: 'Legendary', gems: 3500, steamMarketPrice: 800 },
    { id: 'driver_gloves_king', name: 'Driver Gloves | King Snake', rarity: 'Legendary', gems: 3000, steamMarketPrice: 600 },
    { id: 'moto_gloves_spearmint', name: 'Moto Gloves | Spearmint', rarity: 'Legendary', gems: 2500, steamMarketPrice: 500 }
  ],
  weapons: [
    { id: 'ak47_vulcan', name: 'AK-47 | Vulcan', rarity: 'Rare', gems: 800, steamMarketPrice: 200 },
    { id: 'awp_dragon_lore', name: 'AWP | Dragon Lore', rarity: 'Legendary', gems: 6000, steamMarketPrice: 1500 },
    { id: 'm4a4_howl', name: 'M4A4 | Howl', rarity: 'Legendary', gems: 5000, steamMarketPrice: 1200 },
    { id: 'ak47_redline', name: 'AK-47 | Redline', rarity: 'Rare', gems: 600, steamMarketPrice: 150 },
    { id: 'awp_asiimov', name: 'AWP | Asiimov', rarity: 'Rare', gems: 700, steamMarketPrice: 180 }
  ]
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      skins: CS2_SKINS,
      categories: Object.keys(CS2_SKINS)
    });
  } catch (error) {
    console.error('Get CS2 skins error:', error);
    return NextResponse.json({ error: 'Failed to get skins' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skinId, steamId, steamTradeUrl } = await request.json();

    if (!skinId || !steamId || !steamTradeUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await getDb();

    // Find the skin
    let selectedSkin = null;
    for (const category of Object.values(CS2_SKINS)) {
      const skin = category.find(s => s.id === skinId);
      if (skin) {
        selectedSkin = skin;
        break;
      }
    }

    if (!selectedSkin) {
      return NextResponse.json({ error: 'Skin not found' }, { status: 404 });
    }

    // Get user's current gems
    const user = await getOne(
      'SELECT id, gems FROM users WHERE id = ?',
      [session.user_id]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.gems < selectedSkin.gems) {
      return NextResponse.json({ 
        error: 'Insufficient gems',
        required: selectedSkin.gems,
        current: user.gems 
      }, { status: 400 });
    }

    // Deduct gems
    const newGems = user.gems - selectedSkin.gems;
    run('UPDATE users SET gems = ? WHERE id = ?', [newGems, user.id]);

    // Record transaction
    const transactionId = uuidv4();
    run(`
      INSERT INTO user_transactions (id, user_id, type, amount, currency, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      transactionId,
      user.id,
      'cs2_skin_purchase',
      -selectedSkin.gems,
      'gems',
      `Purchased CS2 skin: ${selectedSkin.name} for ${selectedSkin.gems} gems`,
      new Date().toISOString()
    ]);

    // Create skin delivery record
    const deliveryId = uuidv4();
    run(`
      INSERT INTO cs2_skin_deliveries (id, user_id, skin_id, skin_name, gems_paid, steam_id, steam_trade_url, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      deliveryId,
      user.id,
      skinId,
      selectedSkin.name,
      selectedSkin.gems,
      steamId,
      steamTradeUrl,
      'pending',
      new Date().toISOString()
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${selectedSkin.name}`,
      purchase: {
        skin: selectedSkin,
        gemsPaid: selectedSkin.gems,
        steamId,
        deliveryId
      },
      newBalance: {
        gems: newGems
      },
      delivery: {
        status: 'pending',
        estimatedDelivery: '24-48 hours',
        instructions: 'Our team will send you a trade offer within 24-48 hours. Please accept the trade to receive your skin.'
      }
    });

  } catch (error) {
    console.error('CS2 skin purchase error:', error);
    return NextResponse.json({ error: 'Purchase failed' }, { status: 500 });
  }
}
