import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../lib/auth-utils';
import { supabase } from "../../../lib/supabase";

// Admin-only: Create test users for development
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { count = 5, baseUsername = 'testuser' } = await request.json();

    if (count > 50) {
      return NextResponse.json({ 
        error: 'Cannot create more than 50 users at once' 
      }, { status: 400 });
    }

    const testUsers: Array<{
      id: string;
      username: string;
      email: string;
      role: string;
      balance: number;
      level: number;
      xp: number;
      vip_tier: string;
      created_at: string;
      updated_at: string;
      last_login: string;
      is_active: boolean;
    }> = [];
    const timestamp = Date.now();

    for (let i = 1; i <= count; i++) {
      const testUser = {
        id: `test_${timestamp}_${i}`,
        username: `${baseUsername}${i}`,
        email: `${baseUsername}${i}@example.com`,
        role: 'user',
        balance: Math.floor(Math.random() * 1000) + 100, // Random balance 100-1099
        level: Math.floor(Math.random() * 50) + 1, // Random level 1-50
        xp: Math.floor(Math.random() * 10000),
        vip_tier: 'none',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        is_active: true
      };
      testUsers.push(testUser);
    }

    // Insert test users
    const { data: createdUsers, error: createError } = await supabase
      .from('users')
      .insert(testUsers)
      .select();

    if (createError) {
      console.error('Error creating test users:', createError);
      
      if (createError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          message: 'Users table not found. Please set up the database tables first.',
          users: []
        });
      }
      
      return NextResponse.json({ error: 'Failed to create test users' }, { status: 500 });
    }

    // Create some test transactions for the users
    const testTransactions: Array<{
      user_id: any;
      type: string;
      amount: number;
      description: string;
      created_at: string;
    }> = [];
    for (const user of createdUsers) {
      // Create 2-5 random transactions per user
      const transactionCount = Math.floor(Math.random() * 4) + 2;
      for (let j = 0; j < transactionCount; j++) {
        const types = ['deposit', 'bet', 'win', 'bonus'];
        const type = types[Math.floor(Math.random() * types.length)];
        const amount = type === 'win' ? Math.floor(Math.random() * 500) + 50 :
                     type === 'bet' ? -(Math.floor(Math.random() * 100) + 10) :
                     Math.floor(Math.random() * 200) + 25;

        testTransactions.push({
          user_id: user.id,
          type,
          amount,
          description: `Test ${type} transaction`,
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }

    // Insert test transactions
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert(testTransactions);

    if (transactionError && transactionError.code !== 'PGRST116') {
      console.error('Error creating test transactions:', transactionError);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdUsers.length} test users with transaction history`,
      users: createdUsers.map((u: any) => ({ 
        id: u.id, 
        username: u.username, 
        email: u.email,
        balance: u.balance,
        level: u.level 
      }))
    });

  } catch (error) {
    console.error('Error creating test users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin-only: Get list of test users
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const testOnly = searchParams.get('test_only') === 'true';

    let query = supabase
      .from('users')
      .select('id, username, email, role, balance, level, xp, vip_tier, created_at, last_login, is_active')
      .order('created_at', { ascending: false });

    if (testOnly) {
      query = query.ilike('username', 'testuser%');
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      
      if (usersError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          users: [],
          total: 0,
          message: 'Users table not found. Please set up the database.'
        });
      }
      
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      users,
      total: users?.length || 0
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin-only: Delete test users
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { testUsersOnly = true } = await request.json();

    if (!testUsersOnly) {
      // Safety check - require explicit confirmation for deleting all users
      return NextResponse.json({ 
        error: 'Deleting all users requires manual confirmation' 
      }, { status: 400 });
    }

    // Delete related transactions first - get test user IDs
    const { data: testUsers } = await supabase
      .from('users')
      .select('id')
      .ilike('username', 'testuser%');

    if (testUsers && testUsers.length > 0) {
      const testUserIds = testUsers.map((u: any) => u.id);
      
      const { error: transactionError } = await supabase
        .from('transactions')
        .delete()
        .in('user_id', testUserIds);

      if (transactionError && transactionError.code !== 'PGRST116') {
        console.error('Error deleting test transactions:', transactionError);
      }
    }

    // Delete test users
    const { data: deletedUsers, error: deleteError } = await supabase
      .from('users')
      .delete()
      .ilike('username', 'testuser%')
      .select();

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          message: 'Test users cleaned up (users table not found)',
          deletedCount: 0
        });
      }
      console.error('Error deleting test users:', deleteError);
      return NextResponse.json({ error: 'Failed to delete test users' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedUsers?.length || 0} test users and their data`,
      deletedCount: deletedUsers?.length || 0
    });

  } catch (error) {
    console.error('Error deleting test users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
