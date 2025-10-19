# EquipGG - Socket.IO to Supabase Realtime Migration Plan

## 🔍 ANALYSIS COMPLETE - Issues Identified

### 1. Socket.IO Dependencies (TO BE REMOVED)
**Files using Socket.IO:**
- `src/contexts/socket-context.tsx` - Main Socket.IO context provider
- `src/lib/socket.ts` - Socket manager class
- `src/lib/socket-server.ts` - Server-side Socket.IO setup
- `src/lib/socket-fallback.ts` - Fallback system
- `src/app/api/socket/route.ts` - Socket.IO API route
- `src/pages/api/socket.io.ts` - Pages API socket handler
- `src/lib/notification-service.ts` - Uses socket.io-client

**Components using useSocket hook:**
- `src/components/match-card.tsx` - Betting notifications
- `src/components/live-chat.tsx` - Chat functionality
- `src/hooks/use-realtime-betting.ts` - Real-time betting updates
- `src/app/dashboard/betting-chat/page.tsx`
- `src/app/dashboard/chat/page.tsx`

### 2. Mock Data & Placeholder Issues
**Files with mock data:**
- `src/lib/mock-data.ts` - Contains mock data
- `src/app/api/crates/give/route.ts` - 16 mock references
- `src/app/api/crates/open/route.ts` - 12 mock references
- `src/app/api/payments/stripe/route.ts` - 5 mock references
- `src/app/dashboard/payments/page.tsx` - Mock payment data
- `src/app/api/trade-up/route.ts` - Mock trade data
- `src/app/api/trading/users/route.ts` - Mock users
- Multiple other files with mock implementations

### 3. Steam Auth Issues
**Current State:**
- ✅ Steam OAuth flow is implemented in `src/app/api/auth/steam/route.ts`
- ✅ Writes `steam_id`, `username`, `avatar_url` to users table
- ⚠️ Uses both `username` and `displayname` fields inconsistently
- ⚠️ Session management needs verification

**Action Items:**
- Standardize on `username` field (remove `displayname` references)
- Verify avatar and username sync on every login
- Ensure dashboard displays live Steam data

### 4. Database Schema Status
**Supabase Configuration:**
- ✅ Connection configured: `https://rxamnospcmbtgzptmmxl.supabase.co`
- ✅ Service role key present
- ⚠️ Migration file is empty (`supabase/migrations/20251003194051_remote_schema.sql`)
- ❌ Need to verify all tables exist: `users`, `matches`, `bets`, `crates`, `missions`, `achievements`, `inventory`, `leaderboard`, `xp_log`

### 5. Missing/Incomplete Features
**Dashboard:**
- ⚠️ Uses API endpoints with TODO comments
- ⚠️ Mission data fetched from API, not direct Supabase queries
- ⚠️ User stats may not be real-time

**XP & Leveling:**
- ❓ Need to verify XP progression system
- ❓ Level-up notifications currently via Socket.IO

**Missions & Achievements:**
- ⚠️ `src/app/dashboard/admin/page.tsx` has 10 TODO comments
- ⚠️ Mission progress tracking incomplete

**Crates & Inventory:**
- ⚠️ Heavy mock data usage in crate opening
- ❓ Inventory system needs verification

**Admin Panel:**
- ⚠️ Multiple TODOs in admin dashboard

---

## 🎯 MIGRATION STRATEGY

### Phase 1: Database Schema Verification & Setup
1. ✅ Connect to Supabase and verify all tables exist
2. ✅ Create missing tables if needed
3. ✅ Set up Realtime publication for required tables
4. ✅ Enable Row Level Security (RLS) policies

### Phase 2: Create Supabase Realtime Infrastructure
1. ✅ Create `src/lib/supabase/realtime.ts` - Realtime channel manager
2. ✅ Create `src/contexts/realtime-context.tsx` - Replace socket-context
3. ✅ Define channel structure:
   - `match_updates` - Match results, betting updates
   - `xp_updates` - XP gains, level-ups
   - `inventory_changes` - Crate openings, item additions
   - `leaderboard_updates` - Leaderboard changes
   - `chat_messages` - Chat system
   - `notifications` - System notifications

### Phase 3: Replace Socket.IO with Supabase Realtime
1. ✅ Update `use-realtime-betting.ts` to use Supabase channels
2. ✅ Update `match-card.tsx` to use new realtime context
3. ✅ Update `live-chat.tsx` to use Supabase Realtime
4. ✅ Update all API routes to broadcast via Supabase instead of Socket.IO
5. ✅ Remove all Socket.IO dependencies

### Phase 4: Fix Steam Auth & User Data
1. ✅ Standardize username field (remove displayname)
2. ✅ Ensure avatar_url syncs on every login
3. ✅ Update dashboard to display live user data
4. ✅ Fix mini-profile component

### Phase 5: Complete Missing Features
1. ✅ Implement real XP progression system
2. ✅ Complete mission tracking with Supabase
3. ✅ Implement achievement unlock system
4. ✅ Fix crate opening (remove mocks, use real data)
5. ✅ Complete inventory system
6. ✅ Finish admin panel features

### Phase 6: Testing & Verification
1. ✅ Test Steam login flow
2. ✅ Test XP gain → Level up → Crate unlock → Open crate → Receive item
3. ✅ Test mission completion → Achievement unlock
4. ✅ Test real-time updates across all features
5. ✅ Verify admin panel functionality
6. ✅ Test on Vercel deployment

---

## 📋 DETAILED TASK LIST

### Immediate Actions (Priority 1)
- [ ] Verify Supabase schema and create missing tables
- [ ] Create Supabase Realtime context and channel manager
- [ ] Replace socket-context with realtime-context
- [ ] Update all components using useSocket to use useRealtime
- [ ] Remove Socket.IO from package.json dependencies

### Data Migration (Priority 2)
- [ ] Remove all mock data from crate system
- [ ] Remove mock data from payment system
- [ ] Remove mock data from trading system
- [ ] Ensure all API routes use real Supabase data

### Feature Completion (Priority 3)
- [ ] Complete XP/Level system with real-time updates
- [ ] Complete mission tracking system
- [ ] Complete achievement system
- [ ] Complete crate opening animations with real data
- [ ] Complete inventory management
- [ ] Complete admin dashboard

### UI/UX Fixes (Priority 4)
- [ ] Fix hero section alignment
- [ ] Ensure responsive design on all breakpoints
- [ ] Fix any layout issues in dashboard
- [ ] Standardize Steam avatar/username display

### Deployment Prep (Priority 5)
- [ ] Remove all Socket.IO server code
- [ ] Update environment variables documentation
- [ ] Test build process
- [ ] Verify Vercel compatibility
- [ ] Create deployment checklist

---

## 🔧 TECHNICAL IMPLEMENTATION DETAILS

### Supabase Realtime Channel Structure
```typescript
// Channel: 'match_updates'
// Events: 'match_result', 'new_bet', 'odds_update'

// Channel: 'xp_updates'
// Events: 'xp_gained', 'level_up'

// Channel: 'inventory_changes'
// Events: 'item_added', 'item_removed', 'crate_opened'

// Channel: 'leaderboard_updates'
// Events: 'rank_changed', 'new_leader'

// Channel: 'chat_messages'
// Events: 'new_message', 'user_joined', 'user_left'

// Channel: 'notifications'
// Events: 'achievement_unlocked', 'mission_completed', 'system_alert'
```

### API Route Broadcasting Pattern
```typescript
// Before (Socket.IO):
io.to(`betting:${matchId}`).emit('new-bet', data);

// After (Supabase Realtime):
await supabase.channel('match_updates').send({
  type: 'broadcast',
  event: 'new_bet',
  payload: { matchId, ...data }
});
```

### Client Listening Pattern
```typescript
// Before (Socket.IO):
socket.on('new-bet', (data) => handleNewBet(data));

// After (Supabase Realtime):
const channel = supabase.channel('match_updates');
channel.on('broadcast', { event: 'new_bet' }, ({ payload }) => {
  handleNewBet(payload);
});
channel.subscribe();
```

---

## 📊 PROGRESS TRACKING

**Total Tasks:** ~50
**Completed:** 0
**In Progress:** Analysis
**Blocked:** None

**Estimated Time:** 6-8 hours of focused development
**Risk Level:** Medium (requires careful testing of real-time features)

---

## ✅ SUCCESS CRITERIA

1. ✅ Zero Socket.IO dependencies in package.json
2. ✅ All real-time features working via Supabase Realtime
3. ✅ Steam login syncs avatar and username correctly
4. ✅ Dashboard shows live data from Supabase
5. ✅ XP/Level/Mission/Achievement systems fully functional
6. ✅ Crate opening works with real data and animations
7. ✅ Admin panel fully operational
8. ✅ Successful deployment on Vercel with no errors
9. ✅ Real-time updates work across all features
10. ✅ No mock data or placeholders remaining

---

**Status:** Ready to begin implementation
**Next Step:** Verify Supabase schema and create Realtime infrastructure
