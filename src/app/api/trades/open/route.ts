import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";

// GET /api/trades/open - Get all open trades available for offers
export async function GET(request: NextRequest) {
  console.log('🔥 /api/trades/open called');
  try {
    console.log('🔍 Starting /api/trades/open');
    const supabase = createServerSupabaseClient();
    
    if (!supabase) {
      console.error('❌ Failed to create Supabase client');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    // Simple auth check using cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/equipgg_session=([^;]+)/);
    
    let userId: string | null = null;
    
    if (cookieMatch) {
      try {
        // Double decode because Next.js encodes cookies
        let cookieValue = cookieMatch[1];
        // Decode once
        cookieValue = decodeURIComponent(cookieValue);
        // If still encoded, decode again
        if (cookieValue.startsWith('%')) {
          cookieValue = decodeURIComponent(cookieValue);
        }
        const sessionData = JSON.parse(cookieValue);
        if (sessionData.user_id && (!sessionData.expires_at || Date.now() < sessionData.expires_at)) {
          userId = sessionData.user_id;
        }
      } catch (e) {
        console.error('Failed to parse session cookie:', e);
      }
    }
    
    if (!userId) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('✅ Session found, user:', userId);

    // First, check ALL open trades to debug
    const { data: allOpenTrades } = await supabase
      .from('trade_offers')
      .select('*')
      .eq('status', 'open');
    
    console.log('🔍 ALL OPEN TRADES in DB:', allOpenTrades?.length || 0);
    if (allOpenTrades && allOpenTrades.length > 0) {
      console.log('🔍 First trade details:', {
        id: allOpenTrades[0].id,
        sender_id: allOpenTrades[0].sender_id,
        status: allOpenTrades[0].status,
        expires_at: allOpenTrades[0].expires_at,
        created_at: allOpenTrades[0].created_at,
        isExpired: new Date(allOpenTrades[0].expires_at) < new Date(),
        isSender: allOpenTrades[0].sender_id === userId
      });
    }

    // Get all open trades (TEMPORARILY REMOVING EXPIRATION FILTER FOR DEBUG)
    const currentTime = new Date().toISOString();
    console.log('🔍 Current server time:', currentTime);
    console.log('🔍 Querying for: status=open, sender_id!=' + userId);
    console.log('⚠️ EXPIRATION FILTER DISABLED FOR DEBUGGING');
    
    const { data: trades, error } = await supabase
      .from('trade_offers')
      .select(`
        *,
        sender:users!trade_offers_sender_id_fkey(id, displayname, avatar_url)
      `)
      .eq('status', 'open')
      .neq('sender_id', userId)
      // .gte('expires_at', currentTime)  // TEMPORARILY DISABLED
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching open trades:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: 'Failed to fetch trades', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Found', trades?.length || 0, 'open trades');

    // Get item details for each trade
    const tradesWithItems = await Promise.all(trades.map(async (trade) => {
      const itemIds = trade.sender_items || [];
      let items: any[] = [];

      if (itemIds.length > 0) {
        // Join with items table to get full item data
        const { data } = await supabase
          .from('user_inventory')
          .select(`
            id,
            item_id,
            item_name,
            item_type,
            rarity,
            image_url,
            value,
            quantity,
            items (
              name,
              type,
              rarity,
              image,
              coin_price,
              gem_price
            )
          `)
          .in('id', itemIds);
        
        // EXACT SAME IMAGE LOGIC AS SHOP & ADMIN
        const getItemImageUrl = (itemName: string, category: string) => {
          const baseUrl = 'https://www.csgodatabase.com/images';
          const categoryLower = category?.toLowerCase() || '';
          const nameLower = itemName?.toLowerCase() || '';
          
          const knifeNames = ['karambit', 'bayonet', 'butterfly', 'falchion', 'flip', 'gut', 'huntsman', 
                              'bowie', 'shadow daggers', 'navaja', 'stiletto', 'ursus', 'talon', 
                              'classic knife', 'paracord', 'survival', 'nomad', 'skeleton', 'daggers'];
          
          const gloveNames = ['hand wraps', 'driver gloves', 'sport gloves', 'specialist gloves', 
                              'moto gloves', 'bloodhound gloves', 'hydra gloves', 'broken fang gloves'];
          
          const agentPrefixes = ['agent', 'cmdr', 'lt.', 'sir', 'enforcer', 'operator', 
                                 'ground rebel', 'osiris', 'ava', 'buckshot', 'two times', 
                                 'sergeant bombson', 'chef d', "'medium rare' crasswater"];
          
          let path = 'skins';
          
          if (categoryLower.includes('knife') || categoryLower === 'knives' || 
              knifeNames.some(knife => nameLower.includes(knife))) {
            path = 'knives';
          } 
          else if (categoryLower.includes('glove') || categoryLower === 'gloves' || 
                   gloveNames.some(glove => nameLower.includes(glove))) {
            path = 'gloves';
          }
          else if (categoryLower.includes('agent') || categoryLower === 'agents' || 
                   agentPrefixes.some(prefix => nameLower.startsWith(prefix) || nameLower.includes(prefix))) {
            path = 'agents';
          }
          
          const formattedName = itemName
            .replace(/\s*\|\s*/g, '_')
            .replace(/\s+/g, '_');
          return `${baseUrl}/${path}/webp/${formattedName}.webp`;
        };
        
        items = (data || []).map((inv: any) => {
          const itemName = inv.item_name || inv.items?.name || 'CS:GO Item';
          const itemType = inv.item_type || inv.items?.type || 'weapon';
          const imageUrl = inv.image_url || inv.items?.image || getItemImageUrl(itemName, itemType);
          
          return {
            id: inv.id,
            item_id: inv.item_id,
            item_name: itemName,
            name: itemName,
            item_type: itemType,
            type: itemType,
            rarity: inv.rarity || inv.items?.rarity || 'common',
            image_url: imageUrl,
            image: imageUrl,
            value: inv.value || inv.items?.coin_price || inv.items?.gem_price || 10,
            quantity: inv.quantity || 1
          };
        });
        
        console.log(`📦 Trade ${trade.id} items:`, items);
      }

      return {
        ...trade,
        senderItemsDetails: items
      };
    }));

    console.log('📦 Returning trades with items:', tradesWithItems.length);

    return NextResponse.json({
      success: true,
      trades: tradesWithItems,
      total: tradesWithItems.length
    });

  } catch (error) {
    console.error('❌❌❌ Get open trades CRITICAL ERROR:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error type:', typeof error);
    console.error('Error keys:', error && typeof error === 'object' ? Object.keys(error) : 'N/A');
    
    // ALWAYS return JSON, never let it fail to HTML
    return NextResponse.json({ 
      error: 'Failed to fetch trades',
      message: error instanceof Error ? error.message : String(error),
      type: typeof error,
      stack: error instanceof Error ? error.stack : undefined
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
