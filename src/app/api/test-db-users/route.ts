import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../lib/auth-utils';
import { supabase } from "../../../lib/supabase";

// Admin-only: Test database connection and user operations
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
    const testType = searchParams.get('test') || 'connection';

    let testResults = {
      timestamp: new Date().toISOString(),
      testType,
      results: {} as any
    };

    switch (testType) {
      case 'connection':
        // Test basic Supabase connection
        try {
          const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);

          testResults.results = {
            connection: error ? 'FAILED' : 'SUCCESS',
            error: error?.message || null,
            tablesAccessible: !error
          };
        } catch (err) {
          testResults.results = {
            connection: 'FAILED',
            error: (err as Error).message,
            tablesAccessible: false
          };
        }
        break;

      case 'users':
        // Test user operations
        const userTests = {
          read: { status: 'PENDING', error: null, count: 0 },
          create: { status: 'PENDING', error: null, userId: null },
          update: { status: 'PENDING', error: null },
          delete: { status: 'PENDING', error: null }
        };

        // Test read
        try {
          const { data: users, error: readError } = await supabase
            .from('users')
            .select('id, username, created_at')
            .limit(5);

          userTests.read = {
            status: readError ? 'FAILED' : 'SUCCESS',
            error: readError?.message || null,
            count: users?.length || 0
          };
        } catch (err) {
          userTests.read = {
            status: 'FAILED',
            error: (err as Error).message,
            count: 0
          };
        }

        // Test create (temporary test user)
        const testUserId = `test_db_check_${Date.now()}`;
        try {
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
              id: testUserId,
              username: `test_db_${Date.now()}`,
              email: `test_db_${Date.now()}@example.com`,
              role: 'user',
              balance: 0,
              level: 1,
              xp: 0,
              created_at: new Date().toISOString()
            }])
            .select()
            .single();

          userTests.create = {
            status: createError ? 'FAILED' : 'SUCCESS',
            error: createError?.message || null,
            userId: newUser?.id || null
          };

          // Test update if create succeeded
          if (!createError && newUser) {
            const { error: updateError } = await supabase
              .from('users')
              .update({ balance: 100, updated_at: new Date().toISOString() })
              .eq('id', testUserId);

            userTests.update = {
              status: updateError ? 'FAILED' : 'SUCCESS',
              error: updateError?.message || null
            };

            // Test delete
            const { error: deleteError } = await supabase
              .from('users')
              .delete()
              .eq('id', testUserId);

            userTests.delete = {
              status: deleteError ? 'FAILED' : 'SUCCESS',
              error: deleteError?.message || null
            };
          }
        } catch (err) {
          userTests.create = {
            status: 'FAILED',
            error: (err as Error).message,
            userId: null
          };
        }

        testResults.results = userTests;
        break;

      case 'tables':
        // Test all critical tables
        const tables = ['users', 'transactions', 'messages', 'polls', 'matches', 'payments'];
        const tableTests = {} as any;

        for (const table of tables) {
          try {
            const { data, error } = await supabase
              .from(table)
              .select('*')
              .limit(1);

            tableTests[table] = {
              exists: !error,
              accessible: !error,
              error: error?.message || null,
              hasData: (data?.length || 0) > 0
            };
          } catch (err) {
            tableTests[table] = {
              exists: false,
              accessible: false,
              error: (err as Error).message,
              hasData: false
            };
          }
        }

        testResults.results = tableTests;
        break;

      case 'auth':
        // Test authentication system
        const authTests = {
          sessionValid: !!session,
          userExists: !!userData,
          userRole: userData?.role || null,
          adminAccess: userData?.role === 'admin'
        };

        testResults.results = authTests;
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid test type. Use: connection, users, tables, auth' 
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...testResults
    });

  } catch (error) {
    console.error('Error running database tests:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 });
  }
}

// Admin-only: Run comprehensive database health check
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

    const healthCheck = {
      timestamp: new Date().toISOString(),
      overall: 'PENDING' as string,
      tests: {
        connection: { status: 'PENDING', details: null as any },
        tables: { status: 'PENDING', details: null as any },
        users: { status: 'PENDING', details: null as any },
        auth: { status: 'PENDING', details: null as any }
      }
    };

    let allTestsPassed = true;

    // Test connection
    try {
      const { error: connError } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      healthCheck.tests.connection = {
        status: connError ? 'FAILED' : 'SUCCESS',
        details: { connected: !connError, error: connError?.message || null }
      };

      if (connError) allTestsPassed = false;
    } catch (err) {
      healthCheck.tests.connection = {
        status: 'FAILED',
        details: { connected: false, error: (err as Error).message }
      };
      allTestsPassed = false;
    }

    // Test tables
    const tables = ['users', 'transactions', 'messages', 'polls', 'matches', 'payments'];
    const tableResults = {} as any;
    let tablesAvailable = 0;

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);

        const isAvailable = !error;
        tableResults[table] = {
          available: isAvailable,
          error: error?.message || null
        };

        if (isAvailable) tablesAvailable++;
      } catch (err) {
        tableResults[table] = {
          available: false,
          error: (err as Error).message
        };
      }
    }

    healthCheck.tests.tables = {
      status: tablesAvailable >= 3 ? 'SUCCESS' : 'PARTIAL', // Need at least 3 core tables
      details: {
        totalTables: tables.length,
        availableTables: tablesAvailable,
        tables: tableResults
      }
    };

    if (tablesAvailable < 3) allTestsPassed = false;

    // Test user operations
    try {
      const { data: userCount, error: userError } = await supabase
        .from('users')
        .select('count');

      healthCheck.tests.users = {
        status: userError ? 'FAILED' : 'SUCCESS',
        details: {
          canQuery: !userError,
          userCount: userCount?.length || 0,
          error: userError?.message || null
        }
      };

      if (userError) allTestsPassed = false;
    } catch (err) {
      healthCheck.tests.users = {
        status: 'FAILED',
        details: {
          canQuery: false,
          userCount: 0,
          error: (err as Error).message
        }
      };
      allTestsPassed = false;
    }

    // Test auth
    healthCheck.tests.auth = {
      status: session && userData ? 'SUCCESS' : 'FAILED',
      details: {
        sessionValid: !!session,
        userFound: !!userData,
        isAdmin: userData?.role === 'admin'
      }
    };

    if (!session || !userData) allTestsPassed = false;

    healthCheck.overall = allTestsPassed ? 'HEALTHY' : 'ISSUES_DETECTED';

    return NextResponse.json({
      success: true,
      healthCheck
    });

  } catch (error) {
    console.error('Error running health check:', error);
    return NextResponse.json({ 
      error: 'Health check failed',
      details: (error as Error).message
    }, { status: 500 });
  }
}
