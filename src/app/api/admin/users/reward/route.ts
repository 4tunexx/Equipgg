import { NextRequest, NextResponse } from 'next/server';
import { getDb, run, getAll, getOne } from '@/lib/db';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';

// Force recompilation - Server restart required

// POST /api/admin/users/reward - Grant manual rewards to users (updated)
export async function POST(request: NextRequest) {
  try {
    console.log('=== REWARD API CALLED ===');
    console.log('Reward API called - checking getAll import...');
    console.log('getAll function available:', typeof getAll);
    console.log('getAll is function:', typeof getAll === 'function');
    
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const { 
      rewardAllUsers, 
      selectedUsers, 
      rewardType, 
      rewardValue, 
      selectedItem, 
      reason 
    } = await request.json();
    
    console.log('Received reward data:', {
      rewardAllUsers,
      selectedUsers,
      rewardType,
      rewardValue,
      selectedItem,
      reason
    });

    // Validate input
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    if (!rewardAllUsers && (!selectedUsers || selectedUsers.length === 0)) {
      return NextResponse.json({ error: 'No users selected' }, { status: 400 });
    }

    if ((rewardType === 'coins' || rewardType === 'gems' || rewardType === 'xp') && (!rewardValue || rewardValue <= 0)) {
      return NextResponse.json({ error: 'Invalid reward value' }, { status: 400 });
    }

    if ((rewardType === 'item' || rewardType === 'perk') && !selectedItem) {
      return NextResponse.json({ error: 'No item/perk selected' }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date().toISOString();

    // Get target users
    let targetUsers: any[] = [];
    if (rewardAllUsers) {
      const allUsers = await getAll('SELECT id, displayName, email FROM users WHERE role != "admin"', []);
      targetUsers = allUsers;
    } else {
      console.log('Getting selected users, getAll type:', typeof getAll);
      const placeholders = selectedUsers.map(() => '?').join(',');
      console.log('About to call getAll with query and params:', selectedUsers);
      const users = await getAll(`SELECT id, displayName, email FROM users WHERE id IN (${placeholders})`, selectedUsers);
      console.log('getAll result:', users);
      targetUsers = users;
    }

    if (targetUsers.length === 0) {
      console.log('No target users found, returning error');
      return NextResponse.json({ error: 'No valid users found' }, { status: 400 });
    }
    
    console.log('Target users found:', targetUsers.length, 'proceeding with reward processing');

    // Process rewards
    const results = [];
    
    console.log('=== STARTING REWARD PROCESSING ===');
    console.log('Processing rewards for', targetUsers.length, 'users');
    console.log('Reward type:', rewardType, 'Reward value:', rewardValue);
    console.log('Target users:', targetUsers);
    
    for (const user of targetUsers) {
      try {
        console.log('=== PROCESSING USER REWARD ===');
        console.log('Processing reward for user:', user.id, user.displayName);
        if (rewardType === 'coins') {
          console.log(`Updating coins for user ${user.id}: adding ${rewardValue} coins`);
          await run('UPDATE users SET coins = coins + ? WHERE id = ?', [rewardValue, user.id]);
          
          // Verify the update
          const updatedUser = await getOne('SELECT coins FROM users WHERE id = ?', [user.id]);
          console.log(`User ${user.id} now has ${updatedUser?.coins} coins`);
          
          results.push({ userId: user.id, type: 'coins', amount: rewardValue, success: true });
        } else if (rewardType === 'gems') {
          await run('UPDATE users SET gems = gems + ? WHERE id = ?', [rewardValue, user.id]);
          results.push({ userId: user.id, type: 'gems', amount: rewardValue, success: true });
        } else if (rewardType === 'xp') {
          await run('UPDATE users SET xp = xp + ? WHERE id = ?', [rewardValue, user.id]);
          results.push({ userId: user.id, type: 'xp', amount: rewardValue, success: true });
        } else if (rewardType === 'item' || rewardType === 'perk') {
          // Add item/perk to user's inventory
          const itemId = `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await run(`
            INSERT INTO user_inventory (id, user_id, item_id, item_type, quantity, acquired_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [itemId, user.id, selectedItem, rewardType, 1, now]);
          results.push({ userId: user.id, type: rewardType, itemId: selectedItem, success: true });
        }

        // Create notification for the user
        try {
          const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const rewardText = rewardType === 'coins' ? `${rewardValue.toLocaleString()} Coins` :
                           rewardType === 'gems' ? `${rewardValue.toLocaleString()} Gems` :
                           rewardType === 'xp' ? `${rewardValue.toLocaleString()} XP` :
                           rewardType === 'item' ? `Item: ${selectedItem}` :
                           rewardType === 'perk' ? `Perk: ${selectedItem}` : 'Reward';
          
          const notificationTitle = '🎁 Reward Received!';
          const notificationMessage = `You received ${rewardText} from an admin. Reason: ${reason}`;
          
          await run(`
            INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            notificationId,
            user.id,
            notificationTitle,
            notificationMessage,
            'reward',
            0, // not read
            now
          ]);
        } catch (notifError) {
          console.log('Failed to create notification:', notifError);
        }

        // Log the reward action (optional - table might not exist)
        try {
          await run(`
            INSERT INTO admin_actions (id, admin_id, action_type, target_user_id, details, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            session.userId,
            'manual_reward',
            user.id,
            JSON.stringify({
              rewardType,
              rewardValue: rewardType === 'item' || rewardType === 'perk' ? selectedItem : rewardValue,
              reason,
              userDisplayName: user.displayName
            }),
            now
          ]);
        } catch (logError) {
          console.log('Admin actions table not available, skipping log:', logError);
        }

      } catch (error) {
        console.error(`=== ERROR REWARDING USER ${user.id} ===`);
        console.error('Error details:', error);
        console.error('User data:', user);
        console.error('Reward data:', { rewardType, rewardValue, selectedItem, reason });
        results.push({ userId: user.id, success: false, error: 'Failed to process reward' });
      }
    }

    // Export database changes
    await db.export();

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    const rewardText = rewardType === 'coins' ? `${rewardValue.toLocaleString()} Coins` :
                     rewardType === 'gems' ? `${rewardValue.toLocaleString()} Gems` :
                     rewardType === 'xp' ? `${rewardValue.toLocaleString()} XP` :
                     rewardType === 'item' ? `Item: ${selectedItem}` :
                     rewardType === 'perk' ? `Perk: ${selectedItem}` : 'Reward';

    return NextResponse.json({
      success: true,
      message: `Successfully rewarded ${successCount} user(s) with ${rewardText}. ${failureCount > 0 ? `${failureCount} failed.` : ''}`,
      results: {
        total: targetUsers.length,
        successful: successCount,
        failed: failureCount,
        rewardType,
        rewardValue: rewardType === 'item' || rewardType === 'perk' ? selectedItem : rewardValue,
        reason,
        details: results
      }
    });

  } catch (error) {
    console.error('=== CRITICAL ERROR IN REWARD API ===');
    console.error('Error processing manual rewards:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
