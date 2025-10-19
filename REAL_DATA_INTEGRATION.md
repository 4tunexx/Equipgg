# EquipGG - REAL Supabase Data Integration

## ✅ CONFIRMED: Using EXISTING Supabase Data

### 📊 What's Already in Your Database:

1. **66 Achievements** - Categories: betting, progression, social, special
2. **61 Missions** - Types: daily, weekly, special, story
3. **110 Items** - CS2 weapon skins with rarities (common, rare, epic, legendary)
4. **5 Crates** - Level Up, Weekly Loyalty, Prestige, Trade-Up, Summer 2025
5. **8 Chat Channels** - Community channels already configured

---

## 🔄 NEW Integration Files Created

### 1. **Achievement Integration** (`src/lib/achievement-integration.ts`)

**Fetches REAL achievements from Supabase:**
```typescript
// Get all 66 achievements
const achievements = await getAllAchievements();

// Get achievements by category (betting, progression, etc.)
const bettingAchievements = await getAchievementsByCategory('betting');

// Check and award achievements
const newAchievements = await checkAndAwardAchievements(userId, 'betting');

// Get user's unlocked achievements
const unlocked = await getUserAchievements(userId);

// Get progress for specific achievement
const progress = await getAchievementProgress(userId, achievementId);
```

**Supported Achievement Types:**
- `bets_placed` - Total bets placed
- `bets_won` - Total bets won
- `win_streak` - Consecutive wins
- `high_odds_win` - Win with odds >= X
- `single_bet_payout` - Win with payout >= X
- `level` - Reach level X
- `crates_opened` - Total crates opened
- `items_owned` - Total items in inventory

### 2. **Mission Integration** (`src/lib/mission-integration.ts`)

**Fetches REAL missions from Supabase:**
```typescript
// Get all 61 missions
const missions = await getAllMissions();

// Get missions by type
const dailyMissions = await getMissionsByType('daily');
const weeklyMissions = await getMissionsByType('weekly');

// Track mission progress
await trackMissionProgress(userId, 'bet_placed', 1);

// Update specific mission
await updateMissionProgress(userId, missionId, newProgress);

// Reset daily/weekly missions
await resetDailyMissions(userId);
await resetWeeklyMissions(userId);
```

**Mission Types:**
- `daily` - Reset every 24 hours
- `weekly` - Reset every 7 days
- `special` - One-time missions
- `story` - Campaign missions

---

## 🎯 Example Achievements from Your Database

### Betting Achievements:
1. **Getting Started** - Place your first bet
2. **First Victory** - Win your first bet
3. **Regular Bettor** - Place 50 bets total
4. **Consistent Winner** - Win 50 bets total
5. **Heating Up** - Win 3 bets in a row
6. **Against The Odds** - Win with odds 3.0+
7. **Seasoned Veteran** - Place 500 bets
8. **Master Predictor** - Win 250 bets
9. **High Roller** - Win 10,000+ coins in one bet
10. **On Fire!** - Win 7 bets in a row

... and 56 more!

### Example Missions from Your Database:
1. **Daily Login** - Log in daily for XP
2. **Place a Bet** - Make a prediction
3. **Win a Bet** - Successfully predict outcome
4. **Open a Crate** - Unbox items
5. **Complete Trade-Up** - Use Trade-Up Contract
6. **Forum Activity** - Post on forums
7. **Vote in Community** - Cast votes in polls
8. **Check Leaderboard** - View rankings
9. **Customize Profile** - Update profile
10. **The First Step** - First bet tutorial

... and 51 more!

---

## 🔧 Updated API Routes

### Betting API (`src/app/api/betting/place/route.ts`)

**NOW USES:**
```typescript
import { checkAndAwardAchievements } from '@/lib/achievement-integration';
import { trackMissionProgress } from '@/lib/mission-integration';

// After bet placed:
await checkAndAwardAchievements(userId, 'betting'); // Checks all 66 achievements
await trackMissionProgress(userId, 'bet_placed', 1); // Updates mission progress
```

**BEFORE (old hardcoded system):**
```typescript
import { checkAndAwardBadges } from '@/lib/badges-ranks-system'; // ❌ REMOVED
```

---

## 📋 Database Schema

### Achievements Table
```sql
achievements (
  id: string (PK)
  name: string
  description: string
  category: string (betting, progression, social, special)
  requirement_type: string
  requirement_value: number
  xp_reward: number
  coin_reward: number
  gem_reward: number
  icon: string
  rarity: string
  created_at: timestamp
)
```

### Missions Table
```sql
missions (
  id: string (PK)
  name: string
  description: string
  type: string (daily, weekly, special, story)
  requirement_type: string
  requirement_value: number
  xp_reward: number
  coin_reward: number
  gem_reward: number
  repeatable: boolean
  created_at: timestamp
)
```

### User Progress Tables
```sql
user_achievements (
  user_id: string (FK)
  achievement_id: string (FK)
  unlocked_at: timestamp
)

user_missions (
  user_id: string (FK)
  mission_id: string (FK)
  progress: number
  completed: boolean
  created_at: timestamp
  updated_at: timestamp
)
```

---

## 🎮 How It Works

### When a user places a bet:

1. **XP Award** - User gets XP for the action
2. **Achievement Check** - System checks all 66 achievements
   - "Getting Started" (first bet)
   - "Regular Bettor" (50 bets)
   - "High Roller" (10k+ payout)
   - etc.
3. **Mission Progress** - Updates mission progress
   - "Place a Bet" mission
   - "Daily Bettor" mission
   - etc.
4. **Real-time Broadcast** - Notifies all connected clients
5. **Rewards** - Auto-awards XP, coins, gems

### When an achievement unlocks:

1. **Database Update** - Record added to `user_achievements`
2. **Rewards Granted** - XP/coins/gems added to user
3. **Broadcast** - Real-time notification sent
4. **UI Update** - Badge appears in user's profile

---

## 🚀 Next Steps to Complete

### 1. Update UI Components to Fetch Real Data

**Badge Display** - Update to fetch from Supabase:
```typescript
// In your component:
const [achievements, setAchievements] = useState([]);
const [unlocked, setUnlocked] = useState(new Set());

useEffect(() => {
  async function fetchAchievements() {
    const response = await fetch('/api/achievements');
    const data = await response.json();
    setAchievements(data.achievements);
    setUnlocked(new Set(data.unlocked));
  }
  fetchAchievements();
}, []);

// Then render:
<BadgeGrid 
  badges={achievements} 
  earnedBadgeIds={unlocked} 
/>
```

### 2. Create Achievement API Route

**File:** `src/app/api/achievements/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAllAchievements, getUserAchievements } from '@/lib/achievement-integration';
import { getAuthSession } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  const { userId } = await getAuthSession(request);
  
  const achievements = await getAllAchievements();
  const unlocked = userId ? await getUserAchievements(userId) : [];
  
  return NextResponse.json({
    success: true,
    achievements,
    unlocked
  });
}
```

### 3. Create Missions API Route

**File:** `src/app/api/missions/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAllMissions, getUserMissionProgress } from '@/lib/mission-integration';
import { getAuthSession } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  const { userId } = await getAuthSession(request);
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // daily, weekly, etc.
  
  const missions = type 
    ? await getMissionsByType(type)
    : await getAllMissions();
  
  // Get progress for each mission
  const missionsWithProgress = await Promise.all(
    missions.map(async (mission) => {
      const progress = userId 
        ? await getUserMissionProgress(userId, mission.id)
        : null;
      
      return {
        ...mission,
        progress: progress?.progress || 0,
        completed: progress?.completed || false
      };
    })
  );
  
  return NextResponse.json({
    success: true,
    missions: missionsWithProgress
  });
}
```

---

## ✅ What's Been Fixed

### BEFORE (Wrong Approach):
- ❌ Hardcoded 15 badges in `badges-ranks-system.ts`
- ❌ Not using your 66 achievements
- ❌ Not using your 61 missions
- ❌ Creating duplicate data

### AFTER (Correct Approach):
- ✅ Fetches 66 achievements from Supabase
- ✅ Fetches 61 missions from Supabase
- ✅ Uses existing items (110 items)
- ✅ Uses existing crates (5 crates)
- ✅ All data comes from database
- ✅ No hardcoded duplicates

---

## 🎯 Summary

**Your Supabase database already has:**
- ✅ 66 Achievements ready to use
- ✅ 61 Missions ready to use
- ✅ 110 Items (CS2 skins)
- ✅ 5 Crates
- ✅ All necessary tables

**What I've created:**
- ✅ `achievement-integration.ts` - Fetches & awards your 66 achievements
- ✅ `mission-integration.ts` - Tracks progress on your 61 missions
- ✅ Updated betting API to use REAL data
- ✅ Real-time broadcasts for achievements/missions
- ✅ XP system that integrates with everything

**What's left:**
- Create `/api/achievements` route
- Create `/api/missions` route
- Update UI components to fetch from API
- Test achievement unlocking
- Test mission completion

---

**YOU WERE RIGHT! I was creating duplicate data when you already had everything in Supabase. Now it's all integrated! 🎉**
