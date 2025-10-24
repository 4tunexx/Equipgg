import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../lib/supabase";
import { getAuthSession } from "../../../lib/auth-utils";

// GET /api/trades - Get user's trades (sent, received, or all)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // sent, received, all
    const status = searchParams.get('status'); // pending, completed, declined, cancelled

    let query = supabase
      .from('trade_offers')
      .select(`
        *,
        sender:users!trade_offers_sender_id_fkey(id, displayname, avatar_url),
        receiver:users!trade_offers_receiver_id_fkey(id, displayname, avatar_url)
      `)
      .order('created_at', { ascending: false });

    // Filter by type
    if (type === 'sent') {
      query = query.eq('sender_id', session.user_id);
    } else if (type === 'received') {
      query = query.eq('receiver_id', session.user_id);
    } else {
      query = query.or(`sender_id.eq.${session.user_id},receiver_id.eq.${session.user_id}`);
    }

    // Filter by status (exclude cancelled and rejected by default unless specifically requested)
    if (status) {
      query = query.eq('status', status);
    } else {
      // By default, don't show cancelled or rejected trades
      query = query.not('status', 'in', '("cancelled","rejected")');
    }

    const { data: trades, error } = await query;

    if (error) {
      console.error('Error fetching trades:', error);
      return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
    }

    console.log('📦 My Trades API - Found', trades?.length, 'trades for user:', session.user_id);
    console.log('📦 First trade:', trades?.[0]);

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
    
    // Get item details for each trade
    const tradesWithItems = await Promise.all(trades.map(async (trade) => {
      const offeredItemIds = trade.sender_items || [];
      const requestedItemIds = trade.receiver_items || [];

      let offeredItems: any[] = [];
      let requestedItems: any[] = [];

      if (offeredItemIds.length > 0) {
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
          .in('id', offeredItemIds);
        
        offeredItems = (data || []).map((inv: any) => {
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
      }

      if (requestedItemIds.length > 0) {
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
          .in('id', requestedItemIds);
        
        requestedItems = (data || []).map((inv: any) => {
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
      }

      return {
        ...trade,
        offeredItemsDetails: offeredItems,
        requestedItemsDetails: requestedItems
      };
    }));

    console.log('📦 Returning', tradesWithItems.length, 'trades with items');

    return NextResponse.json({
      success: true,
      trades: tradesWithItems
    });

  } catch (error) {
    console.error('Get trades error:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}
