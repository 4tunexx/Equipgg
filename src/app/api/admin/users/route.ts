import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne, getAll, run } from '@/lib/db';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';
import { parse } from 'cookie';

interface DatabaseUser {
  id: number;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role?: string;
  xp?: number;
  level?: number;
  coins?: number;
  gems?: number;
  isMuted?: boolean;
  isBanned?: boolean;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
}

// GET /api/admin/users - Fetch all users for admin management
export async function GET(request: NextRequest) {
  try {
    console.log('Admin users API called');
    const session = await getAuthSession(request);
    
    if (!session) {
      console.log('No session found in admin users API');
      return createUnauthorizedResponse();
    }
    
    console.log('Session found in admin users API:', session.email, 'role:', session.role);
    
    // Check if user is admin
    if (session.role !== 'admin') {
      console.log('User is not admin:', session.role);
      return createForbiddenResponse('Admin access required');
    }
    
    // Debug: Check what users exist in database
    try {
      const allUsers = await getAll('SELECT id, email, displayName, role FROM users', []);
      console.log('All users in database:', allUsers);
    } catch (error) {
      console.log('Error fetching users for debugging:', error);
    }

    // Get search query from URL params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    let query = `
      SELECT id, email, displayName, role, xp, level, coins, gems, 
             createdAt, lastLoginAt,
             CASE 
               WHEN lastLoginAt > datetime('now', '-1 hour') THEN 'Online'
               WHEN lastLoginAt > datetime('now', '-24 hours') THEN 'Recently Active'
               ELSE 'Offline'
             END as status
      FROM users
    `;
    
    const params = [];
    if (search) {
      query += ' WHERE displayName LIKE ? OR email LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY createdAt DESC';
    
    const users = await getAll<DatabaseUser>(query, params);
    
    // Format the response
    const formattedUsers = users.map((user: DatabaseUser) => ({
      id: String(user.id), // Convert numeric ID to string
      email: user.email,
      displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
      name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
      avatar: user.avatarUrl || `https://picsum.photos/40/40?random=${user.id}`,
      avatarUrl: user.avatarUrl,
      role: user.role || 'user',
      xp: user.xp || 0,
      level: user.level || 1,
      balance: user.coins || 0,
      coins: user.coins || 0,
      gems: user.gems || 0,
      isMuted: user.isMuted || false,
      isBanned: user.isBanned || false,
      status: user.status,
      createdAt: user.createdAt,
      lastActive: user.lastLoginAt,
      lastLoginAt: user.lastLoginAt,
      lastSeen: user.lastLoginAt ? 
        new Date(user.lastLoginAt).toLocaleString() : 'Never',
      dataAiHint: 'user avatar'
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/users - Update user data
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const { userId, updates } = await request.json();
    
    if (!userId || !updates) {
      return NextResponse.json({ error: 'Missing userId or updates' }, { status: 400 });
    }

    // Build dynamic update query
    const allowedFields = ['role', 'xp', 'level', 'coins', 'gems', 'displayName'];
    const updateFields = [];
    const updateValues = [];
    
    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        updateFields.push(`${field} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    
    updateValues.push(userId);
    
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    
    await run(updateQuery, updateValues);
    
    // Log the admin action
    await run(
      'INSERT INTO user_transactions (user_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
      [userId, 'admin_action', 0, `Admin ${session.email} updated user data: ${Object.keys(updates).join(', ')}`]
    );

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users - Delete user
export async function DELETE(request: NextRequest) {
  try {
    // Get session from cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookies = parse(cookieHeader);
    const sessionToken = cookies['equipgg_session'];
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    
    // Get session and user info
    const session = await getOne(
      'SELECT s.*, u.email, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?',
      [sessionToken]
    );
    
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Don't allow deleting yourself
    const targetUser = await getOne('SELECT email FROM users WHERE id = ?', [userId]);
    if (targetUser?.email === session.email) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Delete user and related data
    await run('DELETE FROM user_inventory WHERE user_id = ?', [userId]);
    await run('DELETE FROM user_transactions WHERE user_id = ?', [userId]);
    await run('DELETE FROM user_bets WHERE user_id = ?', [userId]);
    await run('DELETE FROM user_crates WHERE user_id = ?', [userId]);
    await run('DELETE FROM user_keys WHERE user_id = ?', [userId]);
    await run('DELETE FROM user_mission_progress WHERE user_id = ?', [userId]);
    await run('DELETE FROM sessions WHERE user_id = ?', [userId]);
    await run('DELETE FROM users WHERE id = ?', [userId]);

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}