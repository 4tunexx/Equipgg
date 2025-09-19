import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../../lib/auth-utils";
import { supabase } from "../../../../lib/supabase";
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    // Get available skins from Steam bot inventory
    const { data: inventory } = await supabase
      .from('steam_bot_inventory')
      .select('*')
      .eq('status', 'available')
      .order('category', { ascending: true })
      .order('gem_price', { ascending: false });

    if (!inventory) {
      return NextResponse.json({
        success: true,
        skins: { knives: [], gloves: [], weapons: [] },
        categories: ['knives', 'gloves', 'weapons']
      });
    }

    // Group skins by category
    const groupedSkins = {
      knives: inventory.filter(skin => skin.category === 'knives'),
      gloves: inventory.filter(skin => skin.category === 'gloves'),
      weapons: inventory.filter(skin => skin.category === 'weapons')
    };

    return NextResponse.json({
      success: true,
      skins: groupedSkins,
      categories: Object.keys(groupedSkins),
      total_items: inventory.length
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

    // Find the skin in bot inventory
    const { data: selectedSkin } = await supabase
      .from('steam_bot_inventory')
      .select('*')
      .eq('id', skinId)
      .eq('status', 'available')
      .single();

    if (!selectedSkin) {
      return NextResponse.json({ error: 'Skin not found or not available' }, { status: 404 });
    }

    // Get user's current gems
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, gems')
      .eq('id', session.user_id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.gems < selectedSkin.gem_price) {
      return NextResponse.json({ 
        error: 'Insufficient gems',
        required: selectedSkin.gem_price,
        current: user.gems 
      }, { status: 400 });
    }

    // Deduct gems
    const newGems = user.gems - selectedSkin.gem_price;
    const { error: updateError } = await supabase
      .from('users')
      .update({ gems: newGems })
      .eq('id', user.id);
    
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update gems' }, { status: 500 });
    }

    // Create trade offer via Steam bot API
    const tradeOfferResponse = await fetch(`${request.url.replace('/shop/cs2-skins', '/steam-bot/trade-offers')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_trade_offer',
        data: {
          item_id: skinId,
          user_steam_id: steamId,
          user_trade_url: steamTradeUrl,
          gems_paid: selectedSkin.gem_price
        }
      })
    });

    const tradeOfferData = await tradeOfferResponse.json();

    if (!tradeOfferData.success) {
      // Refund gems if trade offer creation failed
      await supabase
        .from('users')
        .update({ gems: user.gems })
        .eq('id', user.id);
      
      return NextResponse.json({ error: 'Failed to create trade offer' }, { status: 500 });
    }

    // Record transaction
    const transactionId = uuidv4();
    await supabase.from('user_transactions').insert({
      id: transactionId,
      user_id: user.id,
      type: 'cs2_skin_purchase',
      amount: -selectedSkin.gem_price,
      currency: 'gems',
      description: `Purchased CS2 skin: ${selectedSkin.name} for ${selectedSkin.gem_price} gems`,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${selectedSkin.name}`,
      purchase: {
        skin: selectedSkin,
        gemsPaid: selectedSkin.gem_price,
        steamId,
        tradeOfferId: tradeOfferData.trade_offer_id
      },
      newBalance: {
        gems: newGems
      },
      delivery: {
        status: 'pending',
        estimatedDelivery: tradeOfferData.estimated_delivery,
        instructions: 'A trade offer will be sent to your Steam account within 5-10 minutes. Please accept the trade to receive your skin.'
      }
    });

  } catch (error) {
    console.error('CS2 skin purchase error:', error);
    return NextResponse.json({ error: 'Purchase failed' }, { status: 500 });
  }
}
