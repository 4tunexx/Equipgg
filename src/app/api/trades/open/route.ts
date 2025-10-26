import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { getAuthSession } from "../../../../lib/auth-utils";

// GET /api/trades/open - Get all open trades available for offers
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentTime = new Date().toISOString();
    
    const { data: trades, error } = await supabase
      .from('trade_offers')
      .select(`
        *,
        sender:users!trade_offers_sender_id_fkey(id, displayname, avatar_url)
      `)
      .eq('status', 'open')
      .neq('sender_id', session.user_id)
      .gte('expires_at', currentTime)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching open trades:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch trades', 
        details: error.message 
      }, { status: 500 });
    }

    // Get item details for each trade
    const tradesWithItems = await Promise.all(trades.map(async (trade: any) => {
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
      }

      return {
        ...trade,
        senderItemsDetails: items
      };
    }));

    return NextResponse.json({
      success: true,
      trades: tradesWithItems,
      total: tradesWithItems.length
    });

  } catch (error) {
    console.error('Error fetching open trades:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch trades',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
