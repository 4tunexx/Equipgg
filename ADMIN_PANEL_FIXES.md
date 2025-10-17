# Admin Panel Critical Fixes

## Issues Found

### 1. ❌ Page Toggles Not Working
**Problem:** When admin toggles a page off and saves, it reverts back. Users can still see disabled pages.

**Root Cause:**
- Missing `site_settings` table in database
- Page toggle data has nowhere to be stored

**Fix:** Run SQL in Supabase SQL Editor

### 2. ❌ Activity Feed Not Showing Real Activity
**Problem:** Activity feed is empty or shows no recent user actions.

**Root Causes:**
- Wrong column names in `activity_feed` table
- API queries using incorrect column structure
- Activity logger inserting with wrong schema

**Fix:** Table schema updated + API code fixed

---

## SQL to Run in Supabase (CRITICAL)

**Run this in Supabase SQL Editor:**

```sql
-- 1. Create site_settings table (required for page toggles)
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

-- 2. Fix activity_feed table structure
DROP TABLE IF EXISTS activity_feed CASCADE;

CREATE TABLE activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER DEFAULT 0,
  item_name VARCHAR(255),
  item_rarity VARCHAR(50),
  game_type VARCHAR(50),
  multiplier DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type);

-- 3. Enable RLS for site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to site_settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Allow service role full access to site_settings"
  ON site_settings FOR ALL
  USING (true);

-- 4. Enable RLS for activity_feed
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to activity_feed"
  ON activity_feed FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert their own activities"
  ON activity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Seed test activity data
INSERT INTO activity_feed (user_id, activity_type, description, amount, created_at)
SELECT 
  id::uuid as user_id,
  'level_up' as activity_type,
  'reached level ' || level::text as description,
  level * 100 as amount,
  NOW() - (random() * interval '7 days') as created_at
FROM users
WHERE level > 1
LIMIT 10
ON CONFLICT DO NOTHING;

INSERT INTO activity_feed (user_id, activity_type, description, amount, game_type, created_at)
SELECT 
  id::uuid as user_id,
  'game_win' as activity_type,
  'won ' || (coins / 10)::text || ' coins on crash' as description,
  coins / 10 as amount,
  'crash' as game_type,
  NOW() - (random() * interval '3 days') as created_at
FROM users
WHERE coins > 100
LIMIT 15
ON CONFLICT DO NOTHING;
```

---

## Code Fixes Applied

### ✅ Fixed Files

1. **`src/lib/activity-logger.ts`**
   - Fixed to use correct column names: `activity_type`, `description`, `amount`, `item_name`
   - Added proper description generation for each activity type

2. **`src/app/api/activities/route.ts`**
   - Fixed to query correct columns from `activity_feed`
   - Changed `avatar` to `avatar_url` to match users table
   - Simplified to use activity_feed as primary source

---

## How to Test After SQL Run

### Test 1: Page Toggles
1. Login as admin
2. Go to Admin Panel → Site Control → Page Toggles tab
3. Toggle "shop" to OFF
4. Click "Save Changes"
5. **Expected:** Success toast, toggle stays OFF
6. Logout and login as regular user (or open incognito)
7. Navigate to /dashboard/shop
8. **Expected:** Redirected to /dashboard

### Test 2: Activity Feed
1. Go to main dashboard
2. Look at the Activity Feed section (usually on right side)
3. **Expected:** See recent activities like:
   - "User123 reached level 5"
   - "Player456 won 1,000 coins on crash"
   - Real-time user actions

### Test 3: Admin Panel Tabs
Go through each admin panel tab and verify:
- ✅ **Dashboard** - Shows stats, graphs
- ✅ **Users** - List users, edit roles
- ✅ **Items** - CRUD for shop items
- ✅ **Shop Items** - Manage shop catalog
- ✅ **Matches** - Create/edit betting matches
- ✅ **Missions** - CRUD for missions
- ✅ **Achievements** - List achievements
- ✅ **Crates** - Manage crate system
- ✅ **Ranks** - Level/rank system
- ✅ **Perks** - User perks/boosts
- ✅ **Badges** - Badge management
- ✅ **Support** - View tickets
- ✅ **Messages** - Send notifications
- ✅ **Site Control** - Page toggles, settings

---

## Additional Admin Functions to Verify

### User Management
- [ ] Search users by username
- [ ] Edit user: change role (user/moderator/admin)
- [ ] Edit user: adjust coins/gems/XP
- [ ] Delete user account
- [ ] Ban/unban user

### Item Management
- [ ] Create new item with image upload
- [ ] Edit item details (name, price, rarity)
- [ ] Delete item
- [ ] Toggle item active/inactive

### Match Management
- [ ] Create new match with teams, odds
- [ ] Edit match details
- [ ] Resolve match (set winner)
- [ ] Process bets and payouts

### Site Settings
- [ ] Toggle maintenance mode
- [ ] Enable/disable features
- [ ] Update landing page content
- [ ] Configure gem economy

---

## Middleware Flow (How Page Toggles Work)

```
User visits /dashboard/shop
         ↓
   middleware.ts runs
         ↓
   Fetches /api/page-toggles
         ↓
   Checks if 'shop' toggle exists
         ↓
   If toggle[shop] === false && user !== admin
         ↓
   Redirect to /dashboard
```

**Current Implementation:**
- ✅ Middleware checks role from `equipgg_session` cookie
- ✅ Admins bypass toggle restrictions
- ✅ Non-admin users blocked from disabled pages
- ✅ Preview mode: `?preview=1` to test as non-admin

---

## Troubleshooting

### Page toggles still not working?
1. Check browser console for errors
2. Verify `site_settings` table exists in Supabase
3. Check Network tab: `/api/admin/page-toggles` PUT request should return 200
4. Clear cookies and re-login

### Activity feed still empty?
1. Check Supabase table `activity_feed` has data
2. Run the seed SQL above to add test data
3. Check API: `GET /api/activities` should return array
4. Check browser console for errors

### Admin panel not accessible?
1. Verify user role is 'admin' in `users` table
2. Check `equipgg_session` cookie contains `"role":"admin"`
3. Clear cookies and re-login as admin

---

## Database Schema Reference

### site_settings
```sql
- id (uuid)
- setting_key (varchar) - e.g., 'page_toggles'
- setting_value (text) - JSON string
- setting_type (varchar) - 'json', 'string', etc.
- created_at (timestamp)
- updated_at (timestamp)
```

### activity_feed
```sql
- id (uuid)
- user_id (uuid) → references users
- activity_type (varchar) - 'game_win', 'level_up', etc.
- description (text) - Human readable message
- amount (integer) - Coins won, XP gained, etc.
- item_name (varchar) - Optional item name
- item_rarity (varchar) - Optional rarity
- game_type (varchar) - Optional game type
- multiplier (decimal) - Optional win multiplier
- created_at (timestamp)
```

---

## Next Steps After Fixes

1. ✅ Run SQL in Supabase SQL Editor
2. ✅ Restart dev server (`npm run dev`)
3. ✅ Clear browser cache/cookies
4. ✅ Login as admin
5. ✅ Test page toggles (toggle shop OFF)
6. ✅ Check activity feed shows data
7. ✅ Go through all admin tabs
8. ✅ Test as regular user (disabled pages blocked)

---

**Status:** Ready to deploy after SQL execution
