import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getOne, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Gem packages with real money pricing
const GEM_PACKAGES = {
  starter: { gems: 100, price: 4.99, currency: 'USD' },
  popular: { gems: 500, price: 19.99, currency: 'USD' },
  value: { gems: 1200, price: 39.99, currency: 'USD' },
  premium: { gems: 2500, price: 69.99, currency: 'USD' },
  ultimate: { gems: 5000, price: 119.99, currency: 'USD' }
};

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageId, paymentMethod, steamId } = await request.json();

    if (!packageId || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const packageData = GEM_PACKAGES[packageId];
    if (!packageData) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    await getDb();

    // Get user's current balance
    const user = await getOne(
      'SELECT id, gems FROM users WHERE id = ?',
      [session.user_id]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // In a real implementation, you would:
    // 1. Process payment with Stripe/PayPal/etc.
    // 2. Verify payment success
    // 3. Then add gems to user account

    // For now, simulate successful payment
    const newGems = user.gems + packageData.gems;

    // Update user balance
    run('UPDATE users SET gems = ? WHERE id = ?', [newGems, user.id]);

    // Record transaction
    const transactionId = uuidv4();
    run(`
      INSERT INTO user_transactions (id, user_id, type, amount, currency, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      transactionId,
      user.id,
      'purchase',
      packageData.gems,
      'gems',
      `Purchased ${packageData.gems} gems for $${packageData.price} (${packageId} package)`,
      new Date().toISOString()
    ]);

    // If Steam ID provided, record for potential skin delivery
    if (steamId) {
      const steamTransactionId = uuidv4();
      run(`
        INSERT INTO user_transactions (id, user_id, type, amount, currency, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        steamTransactionId,
        user.id,
        'steam_linked',
        0,
        'steam',
        `Linked Steam ID: ${steamId} for skin delivery`,
        new Date().toISOString()
      ]);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${packageData.gems} gems`,
      purchase: {
        package: packageId,
        gems: packageData.gems,
        price: packageData.price,
        currency: packageData.currency,
        paymentMethod
      },
      newBalance: {
        gems: newGems
      },
      // In real implementation, this would be actual payment confirmation
      paymentConfirmation: {
        transactionId: `pay_${Date.now()}`,
        status: 'completed',
        steamId: steamId || null
      }
    });

  } catch (error) {
    console.error('Gem purchase error:', error);
    return NextResponse.json({ error: 'Purchase failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      packages: GEM_PACKAGES,
      exchangeRates: {
        coinsToGems: 1000,
        gemsToCoins: 800
      }
    });
  } catch (error) {
    console.error('Get packages error:', error);
    return NextResponse.json({ error: 'Failed to get packages' }, { status: 500 });
  }
}
