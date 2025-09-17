import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne, getAll } from '@/lib/db';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    // Get total users
    const totalUsers = await getOne('SELECT COUNT(*) as count FROM users');
    
    // Get new users today
    const newUsersToday = await getOne(
      'SELECT COUNT(*) as count FROM users WHERE DATE(createdAt) = DATE("now")'
    );
    
    // Get active users (logged in within last 24 hours)
    const activeUsers = await getOne(
      'SELECT COUNT(*) as count FROM users WHERE lastLoginAt > datetime("now", "-24 hours")'
    );
    
    // Get total transactions value
    const totalTransactions = await getOne(
      'SELECT COUNT(*) as count, SUM(ABS(amount)) as total FROM user_transactions WHERE type IN ("purchase", "sale", "bet_win", "bet_loss")'
    );
    
    // Get total bets placed
    const totalBets = await getOne(
      'SELECT COUNT(*) as count, SUM(amount) as total FROM user_bets'
    );
    
    // Get recent high-value transactions
    const highValueTransactions = await getAll(`
      SELECT t.*, u.displayName, u.email
      FROM user_transactions t
      JOIN users u ON t.user_id = u.id
      WHERE ABS(t.amount) >= 1000
      ORDER BY t.created_at DESC
      LIMIT 10
    `, []);
    
    // Get user role distribution
    const roleDistribution = await getAll(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role',
      []
    );
    
    // Get recent users
    const recentUsers = await getAll(`
      SELECT id, email, displayName, role, xp, level, createdAt
      FROM users
      ORDER BY createdAt DESC
      LIMIT 10
    `, []);
    
    // Get daily registration stats for the last 7 days
    const dailyRegistrations = await getAll(`
      SELECT DATE(createdAt) as date, COUNT(*) as count
      FROM users
      WHERE createdAt >= datetime('now', '-7 days')
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `, []);
    
    // Get top spenders
    const topSpenders = await getAll(`
      SELECT u.displayName, u.email, SUM(ABS(t.amount)) as totalSpent
      FROM users u
      JOIN user_transactions t ON u.id = t.user_id
      WHERE t.type IN ('purchase', 'bet_loss')
      GROUP BY u.id
      ORDER BY totalSpent DESC
      LIMIT 10
    `, []);
    
    // Get inventory statistics
    const inventoryStats = await getOne(`
      SELECT 
        COUNT(*) as totalItems,
        COUNT(DISTINCT user_id) as usersWithItems
      FROM user_inventory
    `);
    
    // Get crate opening statistics (currently unused)
    // const crateStats = await db.all(`
    //   SELECT 
    //     COUNT(*) as totalOpened,
    //     SUM(CASE WHEN description LIKE '%opened%' THEN 1 ELSE 0 END) as cratesOpened
    //   FROM user_transactions
    //   WHERE type = 'crate_open'
    // `);
    
    // Get moderation statistics
    const moderationStats = await getAll(`
      SELECT action, COUNT(*) as count
      FROM user_moderation
      WHERE active = 1
      GROUP BY action
    `, []);

    const stats = {
      users: {
        total: totalUsers?.count || 0,
        newToday: newUsersToday?.count || 0,
        active: activeUsers?.count || 0,
        roleDistribution: roleDistribution || []
      },
      economy: {
        totalTransactions: totalTransactions?.count || 0,
        totalTransactionValue: totalTransactions?.total || 0,
        totalBets: totalBets?.count || 0,
        totalBetValue: totalBets?.total || 0
      },
      inventory: {
        totalItems: inventoryStats?.totalItems || 0,
        usersWithItems: inventoryStats?.usersWithItems || 0
      },
      moderation: moderationStats || [],
      recentActivity: {
        highValueTransactions: highValueTransactions || [],
        recentUsers: recentUsers || [],
        dailyRegistrations: dailyRegistrations || [],
        topSpenders: topSpenders || []
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}