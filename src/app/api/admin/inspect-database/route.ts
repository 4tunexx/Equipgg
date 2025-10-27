import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createServerSupabaseClient();
    const results: any = {
      tables: [],
      cratesTable: null,
      crateItems: null,
      userCrateKeys: null,
      items: null,
      userInventory: null,
      existingCrates: [],
      existingFunctions: []
    };

    // 1. Get all tables
    const { data: tables } = await supabaseAdmin
      .rpc('execute_sql', {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `
      });
    results.tables = tables;

    // 2. Check crates table structure
    const { data: cratesColumns } = await supabaseAdmin
      .rpc('execute_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'crates'
          ORDER BY ordinal_position;
        `
      });
    results.cratesTable = cratesColumns;

    // 3. Check for crate_items table
    const { data: crateItemsCheck } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'crate_items')
      .maybeSingle();
    
    if (crateItemsCheck) {
      const { data: crateItemsColumns } = await supabaseAdmin
        .rpc('execute_sql', {
          sql: `
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_name = 'crate_items';
          `
        });
      results.crateItems = crateItemsColumns;
    }

    // 4. Check for user_crate_keys table
    const { data: userKeysCheck } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_crate_keys')
      .maybeSingle();
    
    if (userKeysCheck) {
      const { data: userKeysColumns } = await supabaseAdmin
        .rpc('execute_sql', {
          sql: `
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_name = 'user_crate_keys';
          `
        });
      results.userCrateKeys = userKeysColumns;
    }

    // 5. Check items table structure
    const { data: itemsColumns } = await supabaseAdmin
      .rpc('execute_sql', {
        sql: `
          SELECT column_name, data_type
          FROM information_schema.columns 
          WHERE table_name = 'items'
          ORDER BY ordinal_position;
        `
      });
    results.items = itemsColumns;

    // 6. Check user_inventory structure
    const { data: inventoryColumns } = await supabaseAdmin
      .rpc('execute_sql', {
        sql: `
          SELECT column_name, data_type
          FROM information_schema.columns 
          WHERE table_name = 'user_inventory'
          ORDER BY ordinal_position;
        `
      });
    results.userInventory = inventoryColumns;

    // 7. Get existing crates
    const { data: existingCrates } = await supabaseAdmin
      .from('crates')
      .select('*')
      .limit(10);
    results.existingCrates = existingCrates;

    // 8. Check for crate-related functions
    const { data: functions } = await supabaseAdmin
      .rpc('execute_sql', {
        sql: `
          SELECT routine_name, routine_type
          FROM information_schema.routines
          WHERE routine_schema = 'public'
          AND routine_name LIKE '%crate%';
        `
      });
    results.existingFunctions = functions;

    return NextResponse.json({
      success: true,
      database: results,
      summary: {
        hasCratesTable: !!cratesColumns && cratesColumns.length > 0,
        hasCrateItemsTable: !!crateItemsCheck,
        hasUserCrateKeysTable: !!userKeysCheck,
        existingCratesCount: existingCrates?.length || 0,
        crateFunctionsCount: functions?.length || 0
      }
    });

  } catch (error) {
    console.error('Database inspection error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to inspect database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
