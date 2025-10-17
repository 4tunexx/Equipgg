# Admin Panel Testing Checklist

## Prerequisites
1. ✅ Run SQL fixes in Supabase SQL Editor (see ADMIN_PANEL_FIXES.md)
2. ✅ Restart dev server: `npm run dev`
3. ✅ Clear browser cookies and cache
4. ✅ Login as admin user

---

## 🔴 CRITICAL TESTS (Must Pass)

### 1. Page Toggles System ⭐
**Location:** Admin Panel → Site Control → Page Toggles

**Steps:**
1. Toggle "shop" to OFF
2. Click "Save Changes"
3. Verify: Success message appears
4. Verify: Toggle stays OFF after save
5. Open new incognito window
6. Login as regular user (not admin)
7. Try to access `/dashboard/shop`
8. **EXPECTED:** Redirected to `/dashboard`
9. Back to admin: Toggle "shop" to ON
10. Click "Save Changes"
11. Regular user can now access shop

**API Check:**
- GET `/api/page-toggles` should return: `{"toggles":{"shop":false}}`
- PUT `/api/admin/page-toggles` should return 200 status

---

### 2. Activity Feed ⭐
**Location:** Main Dashboard (right sidebar)

**Steps:**
1. Go to `/dashboard`
2. Look for "Live Activity Feed" section
3. **EXPECTED:** See list of recent activities:
   - "User123 reached level 5"
   - "Player456 won 1,000 coins on crash"
   - Real user actions with timestamps
4. Activities should update (may need manual refresh)

**API Check:**
- GET `/api/activities` should return array with activities
- Check Supabase: `activity_feed` table should have rows

**If Empty:**
- Run the seed SQL from ADMIN_PANEL_FIXES.md
- Check browser console for errors
- Verify table structure matches new schema

---

### 3. User Management ⭐
**Location:** Admin Panel → Users Tab

**Tests:**
- [ ] View all users in list
- [ ] Search for user by username
- [ ] Click edit on a user
- [ ] Change role: user → moderator → admin
- [ ] Adjust coins (add/subtract)
- [ ] Adjust gems (add/subtract)
- [ ] Adjust XP/level
- [ ] Save changes
- [ ] Verify changes persist after refresh
- [ ] Delete a test user (create one first)

**API Endpoints:**
- GET `/api/admin/users` - List all users
- PUT `/api/admin/users` - Update user
- DELETE `/api/admin/users?id=xxx` - Delete user

---

## 🟡 IMPORTANT TESTS (Should Pass)

### 4. Item Management
**Location:** Admin Panel → Items Tab

**Tests:**
- [ ] View all items
- [ ] Create new item
  - [ ] Name, description, category
  - [ ] Rarity (Common, Rare, Epic, Legendary)
  - [ ] Coin price and gem price
  - [ ] Image URL
- [ ] Edit existing item
- [ ] Toggle item active/inactive
- [ ] Delete item

**API Endpoints:**
- GET `/api/admin/items` - List items
- POST `/api/admin/items` - Create item
- PUT `/api/admin/items` - Update item
- DELETE `/api/admin/items?id=xxx` - Delete item

---

### 5. Match Management
**Location:** Admin Panel → Matches Section

**Tests:**
- [ ] View all matches
- [ ] Create new match
  - [ ] Team A and Team B names
  - [ ] Team logos (URLs)
  - [ ] Odds for each team
  - [ ] Match date and time
  - [ ] Stream URL (optional)
- [ ] Edit match details
- [ ] Set match status (upcoming/live/completed)
- [ ] Resolve match (set winner)
- [ ] Verify bets are processed correctly

**API Endpoints:**
- GET `/api/admin/matches` - List matches
- POST `/api/admin/matches` - Create match
- PUT `/api/admin/matches` - Update match
- DELETE `/api/admin/matches?id=xxx` - Delete match

---

### 6. Missions System
**Location:** Admin Panel → Missions Tab

**Tests:**
- [ ] View all missions
- [ ] Create new mission
  - [ ] Name and description
  - [ ] Type (daily, weekly, special)
  - [ ] Requirements (win X games, earn Y coins)
  - [ ] Rewards (XP, coins, gems)
  - [ ] Active status
- [ ] Edit mission
- [ ] Delete mission
- [ ] Toggle mission active/inactive

**API Endpoints:**
- GET `/api/admin/missions` - List missions
- POST `/api/admin/missions` - Create mission
- PUT `/api/admin/missions` - Update mission
- DELETE `/api/admin/missions?id=xxx` - Delete mission

---

### 7. Achievements System
**Location:** Admin Panel → Achievements Tab

**Tests:**
- [ ] View all achievements
- [ ] See achievement categories
- [ ] Check rewards (XP, coins, gems)
- [ ] Verify achievement requirements
- [ ] Test achievement unlock (as user)

**Note:** Achievements may be read-only, seeded via SQL

---

### 8. Crate System
**Location:** Admin Panel → Crates Tab

**Tests:**
- [ ] View all crates
- [ ] Create new crate
  - [ ] Name and description
  - [ ] Prices (coins/gems)
  - [ ] Rarity chances (Common, Rare, Epic, etc.)
  - [ ] Crate image
- [ ] Edit crate details
- [ ] Set crate items (what can be won)
- [ ] Delete crate

**API Endpoints:**
- GET `/api/admin/crates` - List crates
- POST `/api/admin/crates` - Create crate
- PUT `/api/admin/crates` - Update crate
- DELETE `/api/admin/crates?id=xxx` - Delete crate

---

### 9. Ranks/Levels System
**Location:** Admin Panel → Ranks Tab

**Tests:**
- [ ] View all ranks
- [ ] Create new rank
  - [ ] Rank name (Bronze, Silver, Gold, etc.)
  - [ ] Min XP required
  - [ ] Max XP threshold
  - [ ] Tier number
  - [ ] Rank icon/image
- [ ] Edit rank details
- [ ] Delete rank

**API Endpoints:**
- GET `/api/admin/ranks` - List ranks
- POST `/api/admin/ranks` - Create rank
- PUT `/api/admin/ranks` - Update rank
- DELETE `/api/admin/ranks?id=xxx` - Delete rank

---

### 10. Perks System
**Location:** Admin Panel → Perks Tab

**Tests:**
- [ ] View all perks
- [ ] Create new perk
  - [ ] Name and description
  - [ ] Category (XP boost, coin boost, etc.)
  - [ ] Effect value (e.g., 1.5x multiplier)
  - [ ] Duration (hours)
  - [ ] Price (coins/gems)
- [ ] Edit perk
- [ ] Delete perk

**API Endpoints:**
- GET `/api/admin/perks` - List perks
- POST `/api/admin/perks` - Create perk
- PUT `/api/admin/perks` - Update perk
- DELETE `/api/admin/perks?id=xxx` - Delete perk

---

### 11. Support Tickets
**Location:** Admin Panel → Support Tab

**Tests:**
- [ ] View all support tickets
- [ ] Filter by status (open/pending/closed)
- [ ] Search tickets
- [ ] Open ticket details
- [ ] Reply to ticket
- [ ] Change ticket status
- [ ] Close ticket

**Note:** May require users to submit tickets first

---

### 12. Messaging System
**Location:** Admin Panel → Messages Tab

**Tests:**
- [ ] View message compose interface
- [ ] Send message to all users
- [ ] Send message to specific user
- [ ] Message types (info, warning, success, error)
- [ ] Preview message
- [ ] Send and verify delivery

**API Endpoints:**
- POST `/api/admin/messages` - Send message
- GET `/api/admin/messages` - View sent messages

---

### 13. Site Settings
**Location:** Admin Panel → Site Control → Site Settings

**Tests:**
- [ ] Toggle maintenance mode
- [ ] Update site name/title
- [ ] Configure social media links
- [ ] Set featured game/content
- [ ] Update announcement banner
- [ ] Save settings
- [ ] Verify settings persist

---

### 14. Gem Management
**Location:** Admin Panel → Gem Packages Tab

**Tests:**
- [ ] View gem packages
- [ ] Create new package
  - [ ] Package name
  - [ ] Gem amount
  - [ ] USD price
  - [ ] Bonus gems (optional)
  - [ ] Featured status
- [ ] Edit package
- [ ] Toggle package enabled/disabled
- [ ] Delete package

---

### 15. Flash Sales
**Location:** Admin Panel → Flash Sales Tab

**Tests:**
- [ ] View active flash sales
- [ ] Create new flash sale
  - [ ] Item selection
  - [ ] Original price
  - [ ] Sale price (discount %)
  - [ ] Start and end time
  - [ ] Active status
- [ ] Edit flash sale
- [ ] End sale early
- [ ] Delete sale

---

### 16. Rewards System
**Location:** Admin Panel → User Rewards Tab

**Tests:**
- [ ] View all rewards
- [ ] Create login bonus reward
- [ ] Create level-up reward
- [ ] Set reward conditions
- [ ] Configure cooldowns
- [ ] Test reward claiming (as user)

---

## 🟢 BONUS TESTS (Nice to Have)

### 17. Admin Dashboard Stats
**Location:** Admin Panel → Dashboard Tab

**Check displays:**
- [ ] Total users count
- [ ] Active users today/this week
- [ ] Total coins in circulation
- [ ] Total gems purchased
- [ ] Recent transactions
- [ ] User growth chart
- [ ] Revenue stats

---

### 18. Database Management
**Location:** Admin Panel → Database Setup Tab

**Tests:**
- [ ] View database status
- [ ] Check table creation status
- [ ] See migration history
- [ ] Verify table counts

---

### 19. Landing Page Management
**Location:** Admin Panel → Landing Management Tab

**Tests:**
- [ ] Edit hero section content
- [ ] Update feature panels
- [ ] Change testimonials
- [ ] Update FAQ items
- [ ] Preview changes
- [ ] Publish to live site

---

### 20. Moderation Tools
**Location:** Admin Panel → Moderation Tab

**Tests:**
- [ ] View recent user reports
- [ ] Ban/unban users
- [ ] Mute users in chat
- [ ] Delete inappropriate content
- [ ] View moderation logs

---

## Common Issues & Solutions

### Issue: "Unauthorized" or "Forbidden" errors
**Solution:**
1. Verify user role is 'admin' in Supabase `users` table
2. Clear cookies and re-login
3. Check browser console for session cookie

### Issue: Changes not saving
**Solution:**
1. Check Network tab in browser dev tools
2. Look for 500 or 400 errors
3. Check Supabase logs for database errors
4. Verify RLS policies allow admin access

### Issue: Data not loading
**Solution:**
1. Check if tables exist in Supabase
2. Run seed SQL for test data
3. Verify API endpoints return 200 status
4. Check browser console for JS errors

### Issue: Page redirects immediately
**Solution:**
1. Verify admin role in session cookie
2. Check middleware.ts is not blocking
3. Clear cookies and re-login as admin

---

## Quick API Test Commands

### Test Page Toggles API
```bash
# Get current toggles
curl http://localhost:3001/api/page-toggles

# Set toggle (as admin, need session cookie)
curl -X PUT http://localhost:3001/api/admin/page-toggles \
  -H "Content-Type: application/json" \
  -d '{"updates":[{"page":"shop","enabled":false}]}'
```

### Test Activity Feed API
```bash
# Get activities
curl http://localhost:3001/api/activities

# Should return array of activities
```

### Test Users API
```bash
# Get all users (as admin)
curl http://localhost:3001/api/admin/users
```

---

## Success Criteria

**Admin panel is fully functional when:**
- ✅ All page toggles save and work correctly
- ✅ Activity feed shows real user activities
- ✅ User management (edit, delete) works
- ✅ Item CRUD operations work
- ✅ Match creation and management works
- ✅ Mission system fully operational
- ✅ All settings save and persist
- ✅ No console errors on any admin page
- ✅ Regular users cannot access disabled pages
- ✅ Admin actions are logged

---

## Final Verification Steps

1. **As Admin:**
   - [ ] Create a new item
   - [ ] Create a new mission
   - [ ] Toggle shop page OFF
   - [ ] Send a test message
   - [ ] Edit a user's coins

2. **As Regular User:**
   - [ ] Cannot access /dashboard/admin
   - [ ] Cannot access toggled-off pages
   - [ ] Can see activity feed
   - [ ] Can complete missions
   - [ ] Can use shop (if enabled)

3. **System Check:**
   - [ ] No 500 errors in logs
   - [ ] Database queries executing correctly
   - [ ] All API endpoints responding
   - [ ] Frontend rendering without errors
   - [ ] Proper error messages for failed actions

---

**Testing Complete:** If all critical tests pass, admin panel is production-ready! ✅
