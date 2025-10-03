#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeDatabaseIssues() {
  console.log('🔍 COMPREHENSIVE DATABASE ANALYSIS\n');
  console.log('='.repeat(50));

  const expectedTables = [
    'users', 'achievements', 'user_achievements', 'items', 'user_inventory',
    'crates', 'user_crates', 'perks', 'user_perk_claims', 'ranks',
    'user_ranks', 'badges', 'user_badges', 'matches', 'user_bets',
    'missions', 'user_mission_progress', 'forum_categories', 'forum_topics',
    'forum_posts', 'chat_messages', 'notifications', 'user_transactions',
    'user_stats', 'site_settings', 'flash_sales', 'activity_feed'
  ];

  const issues = {
    missingTables: [],
    tablesWithData: [],
    emptyTables: [],
    columnIssues: [],
    relationshipIssues: []
  };

  console.log('📊 CHECKING TABLE EXISTENCE:\n');

  for (const table of expectedTables) {
    try {
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        if (countError.code === 'PGRST116' || countError.message.includes('does not exist')) {
          issues.missingTables.push(table);
          console.log(`❌ ${table} - TABLE MISSING`);
        } else {
          console.log(`⚠️  ${table} - ERROR: ${countError.message}`);
        }
      } else {
        const rowCount = count || 0;
        if (rowCount > 0) {
          issues.tablesWithData.push({ table, count: rowCount });
          console.log(`✅ ${table} - EXISTS (${rowCount} rows)`);
        } else {
          issues.emptyTables.push(table);
          console.log(`⚠️  ${table} - EXISTS BUT EMPTY`);
        }
      }
    } catch (error) {
      console.log(`❌ ${table} - EXCEPTION: ${error.message}`);
      issues.missingTables.push(table);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🔍 CHECKING CRITICAL COLUMN ISSUES:\n');

  // Check specific column issues we know about
  const columnChecks = [
    { table: 'items', column: 'featured', issue: 'Missing featured column' },
    { table: 'users', column: 'avatar_url', issue: 'Avatar URL storage' },
    { table: 'users', column: 'steam_id', issue: 'Steam integration' },
    { table: 'users', column: 'steam_verified', issue: 'Steam verification' },
    { table: 'chat_messages', column: 'lobby', issue: 'Chat lobby support' },
    { table: 'missions', column: 'mission_type', issue: 'Mission categorization' }
  ];

  for (const check of columnChecks) {
    try {
      const { error } = await supabase
        .from(check.table)
        .select(check.column)
        .limit(1);

      if (error && (error.code === '42703' || error.message.includes('does not exist'))) {
        issues.columnIssues.push(check);
        console.log(`❌ ${check.table}.${check.column} - ${check.issue}`);
      } else if (error) {
        console.log(`⚠️  ${check.table}.${check.column} - ERROR: ${error.message}`);
      } else {
        console.log(`✅ ${check.table}.${check.column} - OK`);
      }
    } catch (error) {
      console.log(`❌ ${check.table}.${check.column} - EXCEPTION: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📋 SUMMARY OF ISSUES:\n');

  console.log(`🔴 MISSING TABLES (${issues.missingTables.length}):`);
  issues.missingTables.forEach(table => console.log(`   - ${table}`));

  console.log(`\n🟡 EMPTY TABLES (${issues.emptyTables.length}):`);
  issues.emptyTables.forEach(table => console.log(`   - ${table}`));

  console.log(`\n🟢 TABLES WITH DATA (${issues.tablesWithData.length}):`);
  issues.tablesWithData.forEach(item => console.log(`   - ${item.table} (${item.count} rows)`));

  console.log(`\n🔴 COLUMN ISSUES (${issues.columnIssues.length}):`);
  issues.columnIssues.forEach(issue => console.log(`   - ${issue.table}.${issue.column}: ${issue.issue}`));

  console.log('\n' + '='.repeat(50));
  console.log('🚀 RECOMMENDED ACTIONS:\n');

  if (issues.missingTables.length > 0) {
    console.log('1. CREATE MISSING TABLES:');
    console.log('   Run: /api/admin/database/create-tables');
    console.log('   Or run SQL scripts in Supabase dashboard\n');
  }

  if (issues.emptyTables.length > 0) {
    console.log('2. POPULATE EMPTY TABLES:');
    console.log('   Run: /api/admin/database/populate');
    console.log('   Or run data seeding scripts\n');
  }

  if (issues.columnIssues.length > 0) {
    console.log('3. FIX COLUMN ISSUES:');
    console.log('   Run database migration scripts');
    console.log('   Update table schemas as needed\n');
  }

  return issues;
}

analyzeDatabaseIssues()
  .then(issues => {
    console.log('\n✅ Analysis complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });