import { Server, Socket } from 'socket.io';
import { supabase } from '../lib/supabaseClient';

export default function registerInventoryHandlers(io: Server, socket: Socket) {
  // Crate opened event
  socket.on('crate-opened', async ({ userId, crateId, itemId }) => {
    // Add item to user's inventory in Supabase
    await supabase.from('inventory').insert({ user_id: userId, item_id: itemId, crate_id: crateId });
    socket.emit('inventory-updated');
  });

  // Item equipped event
  socket.on('item-equipped', async ({ userId, itemId }) => {
    await supabase.from('inventory').update({ equipped: true }).eq('user_id', userId).eq('item_id', itemId);
    socket.emit('inventory-updated');
  });

  // Item unequipped event
  socket.on('item-unequipped', async ({ userId, itemId }) => {
    await supabase.from('inventory').update({ equipped: false }).eq('user_id', userId).eq('item_id', itemId);
    socket.emit('inventory-updated');
  });

  // Item sold event
  socket.on('item-sold', async ({ userId, itemId }) => {
    await supabase.from('inventory').delete().eq('user_id', userId).eq('item_id', itemId);
    socket.emit('inventory-updated');
  });

  // Trade up completed event
  socket.on('trade-up-completed', async ({ userId, itemsTraded, newItemId }) => {
    // Remove traded items
    for (const itemId of itemsTraded) {
      await supabase.from('inventory').delete().eq('user_id', userId).eq('item_id', itemId);
    }
    // Add new item
    await supabase.from('inventory').insert({ user_id: userId, item_id: newItemId });
    socket.emit('inventory-updated');
  });

  // Sync inventory event
  socket.on('sync-inventory', async ({ userId }) => {
    const { data: inventory } = await supabase.from('inventory').select('*').eq('user_id', userId);
    socket.emit('inventory-data', inventory);
  });
}
