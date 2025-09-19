# Complete Database Migration Guide

## Overview
This guide walks you through migrating your EquipGG database from the incorrect schema to the complete production schema with all your game content restored.

## What Will Be Restored
✅ **40+ Achievements** - Betting, Economic, Progression, Social, Arcade categories  
✅ **30+ Missions** - Daily missions + Main storyline missions  
✅ **12+ Items** - Knives, Gloves, Rifles, Pistols with proper rarity tiers  
✅ **10 Perks/Power-ups** - XP boosts, Coin boosts, VIP status, Bet insurance  
✅ **8 Rank Tiers** - Complete progression from Newcomer to Immortal  
✅ **Leaderboard System** - Cached leaderboard with performance optimization  
✅ **Game Configuration** - All settings for XP, levels, betting, arcade games  

## Quick Migration (Recommended)

### Option 1: Automated Script Migration
```bash
# From your project root
cd /workspaces/Equipgg
node scripts/migrate-database.js
```

### Option 2: Manual Supabase SQL Editor Migration

1. **Go to Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com/dashboard)
   - Select your EquipGG project
   - Navigate to "SQL Editor"

2. **Step 1: Database Cleanup**
   - Copy content from `supabase/migrations/00_cleanup_database.sql`
   - Paste in SQL Editor and click "Run"
   - ✅ Confirms: "All existing tables and data have been cleaned up"

3. **Step 2: Production Schema**
   - Copy content from `supabase/migrations/production_schema.sql`
   - Paste in SQL Editor and click "Run"
   - ✅ Confirms: "Production schema with all tables created successfully"

4. **Step 3: Game Content Restoration**
   - Copy content from `supabase/migrations/seed_game_content.sql`
   - Paste in SQL Editor and click "Run"
   - ✅ Confirms: "Game content seed completed! Achievements, missions, items, perks, and ranks have been restored."

## Verification Steps

After migration, verify everything works:

### 1. Check Database Structure
```sql
-- Verify main tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should show: achievements, activity_feed, bets, items, matches, missions, perks, rank_tiers, site_settings, users, user_achievements, user_inventory, user_missions, user_perks
```

### 2. Check Game Content
```sql
-- Verify achievements
SELECT COUNT(*), tier FROM achievements GROUP BY tier ORDER BY tier;
-- Should show ~40 achievements across 4 tiers

-- Verify missions
SELECT COUNT(*), type FROM missions GROUP BY type;
-- Should show daily and main missions

-- Verify items
SELECT COUNT(*), rarity FROM items GROUP BY rarity ORDER BY 
  CASE rarity 
    WHEN 'Common' THEN 1 
    WHEN 'Uncommon' THEN 2 
    WHEN 'Rare' THEN 3 
    WHEN 'Epic' THEN 4 
    WHEN 'Legendary' THEN 5 
  END;
-- Should show items across all rarity tiers
```

### 3. Test Your Application
```bash
# Test locally first
npm run dev

# Visit these pages to verify:
# http://localhost:3000/dashboard - Should load without errors
# http://localhost:3000/profile - Check achievements, missions
# Check browser console for any API errors
```

## Post-Migration Deployment

Once migration is complete and verified:

```bash
# Deploy to Vercel
git add .
git commit -m "Complete database migration with all game content"
git push origin main

# Vercel will auto-deploy
# Monitor deployment at https://vercel.com/dashboard
```

## Migration File Details

### `00_cleanup_database.sql`
- Safely removes all existing tables
- Cleans up policies, indexes, and types
- Uses CASCADE to handle dependencies
- Prepares clean slate for production schema

### `production_schema.sql`
- Creates all production tables with correct structure
- Proper column names (display_name vs displayName)
- Correct table names (activity_feed vs user_activity_feed)  
- RLS policies for security
- Indexes for performance
- PandaScore integration ready

### `seed_game_content.sql`
- Restores all 40+ achievements from your local environment
- Seeds 30+ missions (daily + main storyline)
- Populates items with correct rarity distribution
- Adds perks/power-ups system
- Creates rank progression system
- Configures game settings and leaderboard

## Troubleshooting

### If Migration Script Fails
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Run manual SQL migration instead
# Use Supabase dashboard SQL editor
```

### If Vercel Deployment Shows Errors
```bash
# Check Vercel function logs
vercel logs

# Common fixes:
# 1. Clear Vercel build cache
# 2. Redeploy with fresh build
# 3. Verify environment variables in Vercel dashboard
```

### If API Routes Still Error
```bash
# Test specific API endpoints
curl https://equipgg.net/api/leaderboard
curl https://equipgg.net/api/achievements

# Check for column name mismatches
# Verify RLS policies allow access
```

## Environment Variables Checklist

Ensure these are set in Vercel:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `NEXTAUTH_SECRET`
- ✅ `NEXTAUTH_URL`
- ✅ `PANDASCORE_API_KEY`
- ✅ `STEAM_API_KEY`

## Success Indicators

✅ **Migration Completed** - All SQL scripts run without errors  
✅ **Tables Created** - 13+ tables with correct structure  
✅ **Game Content Loaded** - 40+ achievements, 30+ missions, items, perks  
✅ **Local Testing** - Dashboard and profile pages load correctly  
✅ **Vercel Deployment** - Production site loads without API errors  
✅ **User Features** - Authentication, leaderboard, achievements work  

---

**Need Help?** 
- Check the SQL console output for specific error messages
- Verify your Supabase project has sufficient resources
- Ensure environment variables match exactly between local and Vercel
- Test one migration file at a time if the full migration fails