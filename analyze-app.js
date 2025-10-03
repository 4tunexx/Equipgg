#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeApplicationIssues() {
  console.log('🔍 COMPREHENSIVE APPLICATION ANALYSIS\n');
  console.log('='.repeat(50));

  const issues = {
    authIssues: [],
    dataIssues: [],
    uiIssues: [],
    featureIssues: [],
    performanceIssues: []
  };

  console.log('🔐 CHECKING AUTHENTICATION SYSTEM:\n');

  // Check if users exist and have proper auth data
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, username, steam_id, steam_verified, avatar_url, role, xp, level, coins, gems')
      .limit(5);

    if (error) {
      issues.authIssues.push('Cannot query users table');
      console.log('❌ Users table query failed');
    } else {
      console.log(`✅ Users table accessible (${users.length} users found)`);
      
      const steamUsers = users.filter(u => u.steam_id);
      const usersWithAvatars = users.filter(u => u.avatar_url);
      
      console.log(`   - Steam users: ${steamUsers.length}/${users.length}`);
      console.log(`   - Users with avatars: ${usersWithAvatars.length}/${users.length}`);
      
      if (steamUsers.length === 0) {
        issues.authIssues.push('No Steam-authenticated users found');
      }
    }
  } catch (error) {
    issues.authIssues.push('Users table access error');
    console.log(`❌ Exception: ${error.message}`);
  }

  console.log('\n🎮 CHECKING GAME SYSTEMS:\n');

  // Check XP/Leveling system
  try {
    const { data: userStats, error } = await supabase
      .from('user_stats')
      .select('*')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      issues.dataIssues.push('User stats table missing');
      console.log('❌ User stats table missing');
    } else if (userStats && userStats.length === 0) {
      issues.dataIssues.push('No user stats data');
      console.log('⚠️  User stats table empty');
    } else {
      console.log('✅ User stats system available');
    }
  } catch (error) {
    issues.dataIssues.push('User stats system error');
  }

  // Check achievements system
  try {
    const { data: userAchievements, error } = await supabase
      .from('user_achievements')
      .select('*')
      .limit(1);

    if (userAchievements && userAchievements.length === 0) {
      issues.dataIssues.push('No user achievements data');
      console.log('⚠️  No user achievements found (users haven\'t unlocked any)');
    } else {
      console.log('✅ User achievements system working');
    }
  } catch (error) {
    issues.dataIssues.push('Achievements system error');
  }

  // Check inventory system
  try {
    const { data: inventory, error } = await supabase
      .from('user_inventory')
      .select('*')
      .limit(1);

    if (inventory && inventory.length === 0) {
      issues.dataIssues.push('No user inventory data');
      console.log('⚠️  No user inventory items found');
    } else {
      console.log('✅ User inventory system working');
    }
  } catch (error) {
    issues.dataIssues.push('Inventory system error');
  }

  console.log('\n💬 CHECKING REAL-TIME FEATURES:\n');

  // Check chat system
  try {
    const { data: chatMessages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      issues.dataIssues.push('Chat system error');
      console.log('❌ Chat messages query failed');
    } else {
      console.log(`✅ Chat system working (${chatMessages.length} recent messages)`);
      
      // Check for proper user data in messages
      const messagesWithUsers = chatMessages.filter(m => m.user_id);
      if (messagesWithUsers.length < chatMessages.length) {
        issues.dataIssues.push('Some chat messages missing user data');
      }
    }
  } catch (error) {
    issues.dataIssues.push('Chat system exception');
  }

  console.log('\n🛍️ CHECKING SHOP & ECONOMY:\n');

  // Check shop items
  try {
    const { data: shopItems, error } = await supabase
      .from('items')
      .select('id, name, category, coin_price, gem_price, is_active')
      .eq('is_active', true)
      .limit(10);

    if (error) {
      issues.dataIssues.push('Shop items query error');
      console.log('❌ Shop items query failed');
    } else {
      console.log(`✅ Shop system working (${shopItems.length} active items)`);
      
      const itemsWithPrices = shopItems.filter(i => i.coin_price > 0 || i.gem_price > 0);
      if (itemsWithPrices.length === 0) {
        issues.dataIssues.push('No items have prices set');
      }
    }
  } catch (error) {
    issues.dataIssues.push('Shop system exception');
  }

  // Check crate system
  try {
    const { data: crates, error } = await supabase
      .from('crates')
      .select('*')
      .limit(5);

    if (error) {
      issues.dataIssues.push('Crate system error');
    } else {
      console.log(`✅ Crate system working (${crates.length} crates available)`);
    }
  } catch (error) {
    issues.dataIssues.push('Crate system exception');
  }

  console.log('\n📊 CHECKING MATCHES & BETTING:\n');

  // Check matches system
  try {
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(5);

    if (error) {
      issues.dataIssues.push('Matches system error');
      console.log('❌ Matches query failed');
    } else {
      console.log(`✅ Matches system working (${matches.length} recent matches)`);
    }
  } catch (error) {
    issues.dataIssues.push('Matches system exception');
  }

  console.log('\n' + '='.repeat(50));
  console.log('📋 CRITICAL ISSUES SUMMARY:\n');

  console.log(`🔴 AUTHENTICATION ISSUES (${issues.authIssues.length}):`);
  issues.authIssues.forEach(issue => console.log(`   - ${issue}`));

  console.log(`\n🔴 DATA ISSUES (${issues.dataIssues.length}):`);
  issues.dataIssues.forEach(issue => console.log(`   - ${issue}`));

  console.log(`\n🔴 FEATURE ISSUES (${issues.featureIssues.length}):`);
  issues.featureIssues.forEach(issue => console.log(`   - ${issue}`));

  const totalIssues = issues.authIssues.length + issues.dataIssues.length + issues.featureIssues.length;

  console.log('\n' + '='.repeat(50));
  console.log('🚨 PRIORITY FIXES NEEDED:\n');

  if (issues.authIssues.length > 0) {
    console.log('1. FIX AUTHENTICATION:');
    console.log('   - Create test users with Steam auth');
    console.log('   - Test Steam login flow');
    console.log('   - Verify session persistence\n');
  }

  if (issues.dataIssues.includes('No user achievements data')) {
    console.log('2. POPULATE USER DATA:');
    console.log('   - Create sample user achievements');
    console.log('   - Add user inventory items');
    console.log('   - Generate user statistics\n');
  }

  if (issues.dataIssues.includes('No items have prices set')) {
    console.log('3. FIX SHOP ECONOMY:');
    console.log('   - Set proper prices for items');
    console.log('   - Configure gem/coin economy');
    console.log('   - Test purchase flows\n');
  }

  console.log(`\n📊 TOTAL ISSUES FOUND: ${totalIssues}`);
  if (totalIssues === 0) {
    console.log('🎉 Application appears to be functioning correctly!');
  } else {
    console.log('⚠️  Application needs attention in multiple areas');
  }

  return issues;
}

analyzeApplicationIssues()
  .then(issues => {
    console.log('\n✅ Analysis complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });