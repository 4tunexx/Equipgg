import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getOne, run } from '@/lib/db';
import { availableCrates } from '@/lib/mock-data';
import { v4 as uuidv4 } from 'uuid';
import { getActivePerks, hasRarityBooster } from '@/lib/perk-utils';
import { calculateLevel } from '@/lib/xp-utils';
import { getLevelFromXP, defaultXPConfig } from '@/lib/xp-config';
import { logActivity } from '@/lib/activity-logger';
import { trackCrateOpened } from '@/lib/mission-tracker';
import { trackCollectionAchievement } from '@/lib/achievement-tracker';

export async function POST(request: NextRequest) {
  try {
    console.log('🎁 Crate opening request received');
    
    const session = await getAuthSession(request);
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Session found for user:', session.email);

    const { crateId } = await request.json();
    if (!crateId) {
      console.log('❌ No crate ID provided');
      return NextResponse.json({ error: 'Crate ID is required' }, { status: 400 });
    }

    console.log('🎯 Opening crate:', crateId);

    await getDb();

    // Find the crate
    const crate = availableCrates.find(c => c.id === crateId);
    if (!crate) {
      console.log('❌ Crate not found:', crateId);
      return NextResponse.json({ error: 'Crate not found' }, { status: 404 });
    }

    console.log('✅ Crate found:', crate.name);

    // Get user's current balance and check if they have keys
    const user = await getOne(`
      SELECT coins, gems, level FROM users WHERE id = ?
    `, [session.user_id]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has keys for this crate
    const userKeys = await getOne(`
      SELECT keys_count FROM user_keys WHERE user_id = ? AND crate_id = ?
    `, [session.user_id, crateId]);

    console.log('🔑 User keys check:', userKeys);

    if (!userKeys || (userKeys.keys_count as number) <= 0) {
      console.log('❌ No keys available for crate:', crateId);
      return NextResponse.json({ error: 'No keys available for this crate' }, { status: 400 });
    }

    console.log('✅ User has', userKeys.keys_count as number, 'keys for this crate');

    // Get active perks and apply rarity booster
    const activePerks = await getActivePerks(session.user_id);
    const hasRarityBoost = hasRarityBooster(activePerks);
    
    // Simulate opening the crate (random item from crate contents)
    // If user has rarity booster, increase chances of rare items
    let wonItem;
    if (hasRarityBoost) {
      // 50% chance to get a rare item instead of normal distribution
      const rareItems = crate.contents?.filter(item => 
        item.rarity === 'Rare' || item.rarity === 'Epic' || item.rarity === 'Legendary'
      ) || [];
      if (rareItems.length > 0 && Math.random() < 0.5) {
        const randomRareIndex = Math.floor(Math.random() * rareItems.length);
        wonItem = rareItems[randomRareIndex];
      } else {
        const randomIndex = Math.floor(Math.random() * (crate.contents?.length || 0));
        wonItem = crate.contents?.[randomIndex];
      }
    } else {
      // Fallback: if crate has no contents, create a default item
      if (!crate.contents || crate.contents.length === 0) {
        wonItem = {
          name: 'Mystery Item',
          rarity: 'Common',
          type: 'Pistol',
          value: 100,
          image: 'https://picsum.photos/300/200'
        };
      } else {
        const randomIndex = Math.floor(Math.random() * crate.contents.length);
        wonItem = crate.contents[randomIndex];
      }
    }

    // Deduct one key
    try {
      run(`
        UPDATE user_keys 
        SET keys_count = keys_count - 1 
        WHERE user_id = ? AND crate_id = ?
      `, [session.user_id, crateId]);
      console.log('✅ Key deducted successfully');
    } catch (error) {
      console.error('❌ Error deducting key:', error);
      throw new Error('Failed to deduct key');
    }

    // Add XP and coins reward with proper level calculation
    const xpReward = crate.xpReward || 50;
    const coinReward = crate.coinReward || 100;
    
    // Get current user XP to calculate new level
    const currentUser = await getOne(`
      SELECT xp, level FROM users WHERE id = ?
    `, [session.user_id]);
    
    if (currentUser) {
      const newXp = (currentUser.xp as number) + xpReward;
      const newLevel = getLevelFromXP(newXp, defaultXPConfig);
      
      try {
        run(`
          UPDATE users 
          SET xp = ?, coins = coins + ?, level = ?
          WHERE id = ?
        `, [newXp, coinReward, newLevel, session.user_id]);
        console.log('✅ XP and coins updated successfully');
      } catch (error) {
        console.error('❌ Error updating XP/coins:', error);
        throw new Error('Failed to update user stats');
      }
    }

    // Add item to inventory
    const itemId = uuidv4();
    try {
      run(`
        INSERT INTO user_inventory (id, user_id, item_id, item_name, item_type, rarity, value, image_url, acquired_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        itemId,
        session.user_id,
        itemId, // item_id should be the same as id for new items
        wonItem.name,
        wonItem.type || 'Weapon',
        wonItem.rarity,
        (wonItem as any).value || 100,
        wonItem.image || 'https://picsum.photos/300/200',
        new Date().toISOString()
      ]);
      console.log('✅ Item added to inventory:', wonItem.name);
    } catch (error) {
      console.error('❌ Error adding item to inventory:', error);
      throw new Error('Failed to add item to inventory');
    }

    console.log('🎉 Crate opened successfully! Won item:', wonItem.name);
    
    // Log crate opening activity
    try {
      await logActivity({
        userId: session.user_id,
        username: (session as any).user?.email || 'Unknown',
        activityType: 'crate_open',
        itemName: wonItem.name,
        itemRarity: wonItem.rarity as any,
        amount: crate.coinReward || 100,
        activityData: {
          crateId: crate.id,
          crateName: crate.name,
          wonItem: wonItem.name,
          xpReward: crate.xpReward || 50,
          coinReward: crate.coinReward || 100
        }
      });
      console.log('✅ Activity logged for crate opening');
    } catch (error) {
      console.error('❌ Error logging crate opening activity:', error);
    }
    
    // Track mission progress
    await trackCrateOpened(session.user_id);
    
    // Track collection achievements
    await trackCollectionAchievement(session.user_id, 'open_crate');
    
    return NextResponse.json({
      success: true,
      wonItem: wonItem,
      xpReward: crate.xpReward || 50,
      coinReward: crate.coinReward || 100,
      rarityBoostApplied: hasRarityBoost
    });

  } catch (error) {
    console.error('Error opening crate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}