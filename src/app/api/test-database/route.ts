import { NextRequest, NextResponse } from 'next/server';
import { DatabaseFactory } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const database = await DatabaseFactory.getDatabase();
    
    // Test basic operations
    const testResults = {
      databaseType: process.env.DATABASE_TYPE || 'sqlite',
      connection: 'success',
      timestamp: new Date().toISOString(),
      tests: {
        findOne: false,
        findMany: false,
        create: false,
        update: false,
        delete: false,
        rawQuery: false
      }
    };

    // Test 1: Find one (should return null for non-existent record)
    try {
      const findOneResult = await database.findOne('users', { id: 'test-user-123' });
      testResults.tests.findOne = findOneResult.data === null;
    } catch (error) {
      console.error('FindOne test failed:', error);
    }

    // Test 2: Find many
    try {
      const findManyResult = await database.findMany('users', {}, { limit: 5 });
      testResults.tests.findMany = Array.isArray(findManyResult.data);
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

      const createResult = await database.create('users', testUser);
      testResults.tests.create = createResult.success;
      
      // Test 4: Update
      if (createResult.success) {
        const updateResult = await database.update('users', { id: testUser.id }, { coins: 2000 });
        testResults.tests.update = updateResult.success;
        
        // Test 5: Delete
        if (updateResult.success) {
          const deleteResult = await database.delete('users', { id: testUser.id });
          testResults.tests.delete = deleteResult.success;
        }
      }
    } catch (error) {
      console.error('Create/Update/Delete test failed:', error);
    }

    // Test 6: Raw query
    try {
      const rawResult = await database.executeRaw('SELECT COUNT(*) as count FROM users');
      testResults.tests.rawQuery = Array.isArray(rawResult.data) && rawResult.data.length > 0;
    } catch (error) {
      console.error('Raw query test failed:', error);
    }

    // Test transaction (if supported)
    let transactionTest = false;
    try {
      await database.transaction(async (tx) => {
        const result = await tx.findOne('users', { id: 'non-existent' });
        transactionTest = result.data === null;
      });
    } catch (error) {
      console.error('Transaction test failed:', error);
    }

    const allTestsPassed = Object.values(testResults.tests).every(test => test === true);
    
    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed ? 'All database tests passed!' : 'Some database tests failed',
      results: testResults,
      transactionSupported: transactionTest,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseType: process.env.DATABASE_TYPE,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseType: process.env.DATABASE_TYPE || 'sqlite'
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
    const database = await DatabaseFactory.getDatabase();

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
        result = await database.findOne(table, where || {});
        break;
      case 'findMany':
        result = await database.findMany(table, where, data);
        break;
      case 'create':
        result = await database.create(table, data);
        break;
      case 'update':
        result = await database.update(table, where, data);
        break;
      case 'delete':
        result = await database.delete(table, where);
        break;
      case 'raw':
        // SECURITY: Disable raw SQL execution in test endpoint
        return NextResponse.json({ error: 'Raw SQL execution disabled for security' }, { status: 403 });
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
