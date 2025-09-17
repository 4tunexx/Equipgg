import { Server } from 'socket.io';
import { AuthenticatedSocket, CrateOpenedEvent, ItemAcquiredEvent } from './types';
import { emitToUser, emitToAll, createEventData } from './utils';
import { getDb, getOne, run } from '@/lib/db';

export function setupInventorySocket(io: Server) {
  return (socket: AuthenticatedSocket) => {
    console.log(`Inventory socket connected: ${socket.userId}`);

    // Join user to their personal room
    socket.join(`user-${socket.userId}`);

    // Handle crate opening
    socket.on('crate-opened', async (data: Omit<CrateOpenedEvent, 'timestamp' | 'userId'>) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const crateEvent = createEventData(socket.userId, data);

        // Emit to user specifically
        emitToUser(io, socket.userId, 'crate-opened', crateEvent);

        // Add items to user inventory
        const db = await getDb();
        for (const item of data.items) {
          const inventoryId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await run(
            `INSERT INTO user_inventory (id, user_id, item_id, item_name, item_type, rarity, image_url, value, acquired_at, origin)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              inventoryId,
              socket.userId,
              item.id,
              item.name,
              item.type,
              item.rarity,
              item.image_url,
              item.value,
              new Date().toISOString(),
              'Crate Drop'
            ]
          );
        }

        // Emit individual item acquired events
        for (const item of data.items) {
          emitToUser(io, socket.userId, 'item-acquired', {
            userId: socket.userId,
            itemId: item.id,
            itemName: item.name,
            rarity: item.rarity,
            source: 'crate',
            timestamp: new Date().toISOString()
          });
        }

        console.log(`Crate opened: User ${socket.userId} opened crate ${data.crateId} and got ${data.items.length} items`);
      } catch (error) {
        console.error('Crate opening error:', error);
        socket.emit('error', { message: 'Failed to open crate' });
      }
    });

    // Handle item acquired
    socket.on('item-acquired', async (data: Omit<ItemAcquiredEvent, 'timestamp' | 'userId'>) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const itemEvent = createEventData(socket.userId, data);

        // Emit to user specifically
        emitToUser(io, socket.userId, 'item-acquired', itemEvent);

        // Emit to all users for rare items
        if (data.rarity === 'legendary' || data.rarity === 'mythic') {
          emitToAll(io, 'rare-item-acquired', {
            ...itemEvent,
            username: socket.username || 'Anonymous'
          });
        }

        console.log(`Item acquired: User ${socket.userId} acquired "${data.itemName}" (${data.rarity}) from ${data.source}`);
      } catch (error) {
        console.error('Item acquired error:', error);
        socket.emit('error', { message: 'Failed to process item acquisition' });
      }
    });

    // Handle item equipped
    socket.on('item-equipped', async (data: { itemId: string; slot: string }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const db = await getDb();
        
        // Unequip any item in the same slot
        await run(
          'UPDATE user_inventory SET equipped_slot = NULL WHERE user_id = ? AND equipped_slot = ?',
          [socket.userId, data.slot]
        );

        // Equip the new item
        await run(
          'UPDATE user_inventory SET equipped_slot = ? WHERE user_id = ? AND id = ?',
          [data.slot, socket.userId, data.itemId]
        );

        const equipEvent = {
          userId: socket.userId,
          itemId: data.itemId,
          slot: data.slot,
          timestamp: new Date().toISOString()
        };

        // Emit to user
        emitToUser(io, socket.userId, 'item-equipped', equipEvent);

        console.log(`Item equipped: User ${socket.userId} equipped item ${data.itemId} in slot ${data.slot}`);
      } catch (error) {
        console.error('Item equip error:', error);
        socket.emit('error', { message: 'Failed to equip item' });
      }
    });

    // Handle item unequipped
    socket.on('item-unequipped', async (data: { itemId: string; slot: string }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const db = await getDb();
        await run(
          'UPDATE user_inventory SET equipped_slot = NULL WHERE user_id = ? AND id = ?',
          [socket.userId, data.itemId]
        );

        const unequipEvent = {
          userId: socket.userId,
          itemId: data.itemId,
          slot: data.slot,
          timestamp: new Date().toISOString()
        };

        // Emit to user
        emitToUser(io, socket.userId, 'item-unequipped', unequipEvent);

        console.log(`Item unequipped: User ${socket.userId} unequipped item ${data.itemId} from slot ${data.slot}`);
      } catch (error) {
        console.error('Item unequip error:', error);
        socket.emit('error', { message: 'Failed to unequip item' });
      }
    });

    // Handle item sold
    socket.on('item-sold', async (data: { itemId: string; price: number }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const db = await getDb();
        
        // Remove item from inventory
        await run(
          'DELETE FROM user_inventory WHERE user_id = ? AND id = ?',
          [socket.userId, data.itemId]
        );

        // Add coins to user
        await run(
          'UPDATE users SET coins = coins + ? WHERE id = ?',
          [data.price, socket.userId]
        );

        const sellEvent = {
          userId: socket.userId,
          itemId: data.itemId,
          price: data.price,
          timestamp: new Date().toISOString()
        };

        // Emit to user
        emitToUser(io, socket.userId, 'item-sold', sellEvent);

        // Emit balance update
        const user = await getOne('SELECT coins, gems, xp, level FROM users WHERE id = ?', [socket.userId]);
        if (user) {
          emitToUser(io, socket.userId, 'balance-updated', {
            userId: socket.userId,
            coins: user.coins,
            gems: user.gems,
            xp: user.xp,
            level: user.level,
            timestamp: new Date().toISOString()
          });
        }

        console.log(`Item sold: User ${socket.userId} sold item ${data.itemId} for ${data.price} coins`);
      } catch (error) {
        console.error('Item sell error:', error);
        socket.emit('error', { message: 'Failed to sell item' });
      }
    });

    // Handle trade-up completion
    socket.on('trade-up-completed', async (data: { inputItems: string[]; outputItem: any }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const db = await getDb();
        
        // Remove input items
        for (const itemId of data.inputItems) {
          await run(
            'DELETE FROM user_inventory WHERE user_id = ? AND id = ?',
            [socket.userId, itemId]
          );
        }

        // Add output item
        const inventoryId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await run(
          `INSERT INTO user_inventory (id, user_id, item_id, item_name, item_type, rarity, image_url, value, acquired_at, origin)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            inventoryId,
            socket.userId,
            data.outputItem.id,
            data.outputItem.name,
            data.outputItem.type,
            data.outputItem.rarity,
            data.outputItem.image_url,
            data.outputItem.value,
            new Date().toISOString(),
            'Trade-up Contract'
          ]
        );

        const tradeUpEvent = {
          userId: socket.userId,
          inputItems: data.inputItems,
          outputItem: data.outputItem,
          timestamp: new Date().toISOString()
        };

        // Emit to user
        emitToUser(io, socket.userId, 'trade-up-completed', tradeUpEvent);

        console.log(`Trade-up completed: User ${socket.userId} traded ${data.inputItems.length} items for ${data.outputItem.name}`);
      } catch (error) {
        console.error('Trade-up error:', error);
        socket.emit('error', { message: 'Failed to complete trade-up' });
      }
    });

    // Handle inventory sync request
    socket.on('sync-inventory', async () => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const db = await getDb();
        const { getAll } = await import('@/lib/db');
        const inventory = await getAll(
          'SELECT * FROM user_inventory WHERE user_id = ? ORDER BY acquired_at DESC',
          [socket.userId]
        );

        socket.emit('inventory-synced', {
          userId: socket.userId,
          inventory,
          timestamp: new Date().toISOString()
        });

        console.log(`Inventory synced: User ${socket.userId} - ${inventory.length} items`);
      } catch (error) {
        console.error('Inventory sync error:', error);
        socket.emit('error', { message: 'Failed to sync inventory' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Inventory socket disconnected: ${socket.userId}`);
    });
  };
}
