import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getOne, getAll, run } from '@/lib/db';

// GET - Fetch gem management settings
export async function GET(request: NextRequest) {
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

    // Get current gem settings
    const gemSettings = await getOne(`
      SELECT * FROM gem_settings WHERE id = 1
    `);

    // Get exchange rates
    const exchangeRates = await getOne(`
      SELECT * FROM exchange_rates WHERE id = 1
    `);

    // Get gem packages
    const gemPackages = await getAll(`
      SELECT * FROM gem_packages ORDER BY gems ASC
    `);

    // Get CS2 skins
    const cs2Skins = await getAll(`
      SELECT * FROM cs2_skins ORDER BY gems ASC
    `);

    // Get payment settings
    const paymentSettings = await getOne(`
      SELECT * FROM payment_settings WHERE id = 1
    `);

    // Get gem statistics
    const gemStats = await getOne(`
      SELECT 
        COUNT(*) as totalTransactions,
        SUM(CASE WHEN type = 'purchase' THEN amount ELSE 0 END) as totalGemsPurchased,
        SUM(CASE WHEN type = 'purchase' THEN gems_paid ELSE 0 END) as totalRevenue,
        COUNT(CASE WHEN type = 'cs2_skin_purchase' THEN 1 END) as totalSkinPurchases
      FROM gem_transactions
    `);

    return NextResponse.json({
      success: true,
      data: {
        gemSettings: gemSettings || {
          gemShopEnabled: true,
          cs2SkinsEnabled: true,
          exchangeEnabled: true,
          dailyExchangeLimit: 10000,
          maxExchangePerTransaction: 1000,
          gemShopMaintenance: false
        },
        exchangeRates: exchangeRates || {
          coinsToGems: 1000,
          gemsToCoins: 800
        },
        gemPackages,
        cs2Skins,
        paymentSettings: paymentSettings || {
          stripePublicKey: '',
          stripeSecretKey: '',
          paypalClientId: '',
          paypalClientSecret: '',
          webhookSecret: '',
          enabled: false
        },
        gemStats
      }
    });

  } catch (error) {
    console.error('Error fetching gem management data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update gem settings
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

    const body = await request.json();
    const { action, data } = body;

    await getDb();

    switch (action) {
      case 'updateGemSettings':
        await run(`
          INSERT OR REPLACE INTO gem_settings (
            id, gemShopEnabled, cs2SkinsEnabled, exchangeEnabled, 
            dailyExchangeLimit, maxExchangePerTransaction, gemShopMaintenance
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          1,
          data.gemShopEnabled,
          data.cs2SkinsEnabled,
          data.exchangeEnabled,
          data.dailyExchangeLimit,
          data.maxExchangePerTransaction,
          data.gemShopMaintenance
        ]);
        break;

      case 'updateExchangeRates':
        await run(`
          INSERT OR REPLACE INTO exchange_rates (
            id, coinsToGems, gemsToCoins
          ) VALUES (?, ?, ?)
        `, [1, data.coinsToGems, data.gemsToCoins]);
        break;

      case 'updatePaymentSettings':
        await run(`
          INSERT OR REPLACE INTO payment_settings (
            id, stripePublicKey, stripeSecretKey, paypalClientId, 
            paypalClientSecret, webhookSecret, enabled
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          1,
          data.stripePublicKey,
          data.stripeSecretKey,
          data.paypalClientId,
          data.paypalClientSecret,
          data.webhookSecret,
          data.enabled
        ]);
        break;

      case 'addGemPackage':
        await run(`
          INSERT INTO gem_packages (id, gems, price, currency, name, description, enabled)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          data.id,
          data.gems,
          data.price,
          data.currency,
          data.name,
          data.description,
          data.enabled
        ]);
        break;

      case 'updateGemPackage':
        await run(`
          UPDATE gem_packages 
          SET gems = ?, price = ?, currency = ?, name = ?, description = ?, enabled = ?
          WHERE id = ?
        `, [
          data.gems,
          data.price,
          data.currency,
          data.name,
          data.description,
          data.enabled,
          data.id
        ]);
        break;

      case 'deleteGemPackage':
        await run('DELETE FROM gem_packages WHERE id = ?', [data.id]);
        break;

      case 'addCS2Skin':
        await run(`
          INSERT INTO cs2_skins (id, name, rarity, gems, steamMarketPrice, category, enabled)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          data.id,
          data.name,
          data.rarity,
          data.gems,
          data.steamMarketPrice,
          data.category,
          data.enabled
        ]);
        break;

      case 'updateCS2Skin':
        await run(`
          UPDATE cs2_skins 
          SET name = ?, rarity = ?, gems = ?, steamMarketPrice = ?, category = ?, enabled = ?
          WHERE id = ?
        `, [
          data.name,
          data.rarity,
          data.gems,
          data.steamMarketPrice,
          data.category,
          data.enabled,
          data.id
        ]);
        break;

      case 'deleteCS2Skin':
        await run('DELETE FROM cs2_skins WHERE id = ?', [data.id]);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });

  } catch (error) {
    console.error('Error updating gem management:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
