import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../../lib/auth-utils";
import { secureDb } from "../../../../lib/secure-db";

// GET - Fetch gem management settings
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await secureDb.findOne('users', { id: session.user_id });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get current gem settings
    const gemSettings = await secureDb.findOne('gem_settings', { id: 1 });
    // Get exchange rates
    const exchangeRates = await secureDb.findOne('exchange_rates', { id: 1 });
    // Get gem packages
  const gemPackages = await secureDb.findMany('gem_packages', {}, { orderBy: 'gems ASC' });
  // Get CS2 skins
  const cs2Skins = await secureDb.findMany('cs2_skins', {}, { orderBy: 'gems ASC' });
    // Get payment settings
    const paymentSettings = await secureDb.findOne('payment_settings', { id: 1 });
    // Get gem statistics (simulate with aggregate queries if needed)
    // For now, just return null or a placeholder
    const gemStats = null;

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
        gemPackages: gemPackages || [],
        cs2Skins: cs2Skins || [],
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
    const user = await secureDb.findOne('users', { id: session.user_id });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'updateGemSettings':
        await secureDb.create('gem_settings', {
          id: 1,
          gemShopEnabled: data.gemShopEnabled,
          cs2SkinsEnabled: data.cs2SkinsEnabled,
          exchangeEnabled: data.exchangeEnabled,
          dailyExchangeLimit: data.dailyExchangeLimit,
          maxExchangePerTransaction: data.maxExchangePerTransaction,
          gemShopMaintenance: data.gemShopMaintenance
        });
        break;
      case 'updateExchangeRates':
        await secureDb.create('exchange_rates', {
          id: 1,
          coinsToGems: data.coinsToGems,
          gemsToCoins: data.gemsToCoins
        });
        break;
      case 'updatePaymentSettings':
        await secureDb.create('payment_settings', {
          id: 1,
          stripePublicKey: data.stripePublicKey,
          stripeSecretKey: data.stripeSecretKey,
          paypalClientId: data.paypalClientId,
          paypalClientSecret: data.paypalClientSecret,
          webhookSecret: data.webhookSecret,
          enabled: data.enabled
        });
        break;
      case 'addGemPackage':
        await secureDb.create('gem_packages', {
          id: data.id,
          gems: data.gems,
          price: data.price,
          currency: data.currency,
          name: data.name,
          description: data.description,
          enabled: data.enabled
        });
        break;
      case 'updateGemPackage':
        await secureDb.update('gem_packages', { id: data.id }, {
          gems: data.gems,
          price: data.price,
          currency: data.currency,
          name: data.name,
          description: data.description,
          enabled: data.enabled
        });
        break;
      case 'deleteGemPackage':
        await secureDb.delete('gem_packages', { id: data.id });
        break;
      case 'addCS2Skin':
        await secureDb.create('cs2_skins', {
          id: data.id,
          name: data.name,
          rarity: data.rarity,
          gems: data.gems,
          steamMarketPrice: data.steamMarketPrice,
          category: data.category,
          enabled: data.enabled
        });
        break;
      case 'updateCS2Skin':
        await secureDb.update('cs2_skins', { id: data.id }, {
          name: data.name,
          rarity: data.rarity,
          gems: data.gems,
          steamMarketPrice: data.steamMarketPrice,
          category: data.category,
          enabled: data.enabled
        });
        break;
      case 'deleteCS2Skin':
        await secureDb.delete('cs2_skins', { id: data.id });
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
