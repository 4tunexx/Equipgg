import { NextRequest, NextResponse } from 'next/server';
import { secureDb } from '@/lib/secure-db';

export async function GET(request: NextRequest) {
  try {
    // Test basic operations
    const testResults = {
      databaseType: 'supabase',
      connection: 'success',
      timestamp: new Date().toISOString(),
      tests: {
        findOne: false,
        findMany: false,
        create: false,
        update: false,
        delete: false
      }
    };

    // Test 1: Find one (should return null for non-existent record)
    try {
      const findOneResult = await secureDb.findOne('users', { id: 'test-user-123' });
      testResults.tests.findOne = findOneResult === null;
    } catch (error) {
      console.error('FindOne test failed:', error);
    }

    // Test 2: Find many
    try {
      const findManyResult = await secureDb.findMany('users', {}, { limit: 5 });
      testResults.tests.findMany = Array.isArray(findManyResult);
    } catch (error) {
      console.error('FindMany test failed:', error);
    }

    // Test 3: Create (test record)
    try {
      const testUser = {
        id: 'test-user-' + Date.now(),
        email: 'test@example.com',
        passwordHash: 'test-hash',
        displayName: 'Test User',
        role: 'user',
        xp: 0,
        level: 1,
        coins: 1000,
        gems: 0,
        createdAt: new Date().toISOString()
      };

      const createResult = await secureDb.create('users', testUser);
      testResults.tests.create = !!createResult;
      
      // Test 4: Update
      if (createResult) {
        const updateResult = await secureDb.update('users', { id: testUser.id }, { coins: 2000 });
        testResults.tests.update = !!updateResult;
        
        // Test 5: Delete
        if (updateResult) {
          const deleteResult = await secureDb.delete('users', { id: testUser.id });
          testResults.tests.delete = !!deleteResult;
        }
      }
    } catch (error) {
      console.error('Create/Update/Delete test failed:', error);
    }

    const allTestsPassed = Object.values(testResults.tests).every(test => test === true);
    
    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed ? 'All database tests passed!' : 'Some database tests failed',
      results: testResults,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseType: 'supabase',
        hasDatabaseUrl: !!process.env.DATABASE_URL
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseType: 'supabase'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Test endpoint not available in production' }, { status: 403 });
    }

    const { action, table, data, where } = await request.json();

    // SECURITY: Validate table names to prevent SQL injection
    const allowedTables = [
      'users', 'sessions', 'missions', 'user_inventory', 'user_transactions',
      'user_bets', 'game_history', 'chat_messages', 'server_seeds', 'client_seeds', 'game_results'
    ];

    if (table && !allowedTables.includes(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    let result;
    switch (action) {
      case 'findOne':
        result = await secureDb.findOne(table, where || {});
        break;
      case 'findMany':
        result = await secureDb.findMany(table, where, data);
        break;
      case 'create':
        result = await secureDb.create(table, data);
        break;
      case 'update':
        result = await secureDb.update(table, where, data);
        break;
      case 'delete':
        result = await secureDb.delete(table, where);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      result
    });

  } catch (error) {
    console.error('Database operation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
