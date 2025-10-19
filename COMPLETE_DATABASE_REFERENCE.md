# EquipGG - Complete Database Reference

## 📊 EXACT DATABASE CONTENTS

### ✅ 50 RANKS
Full progression system from beginner to legend with benefits at each tier.

### ✅ 68 BADGES
Organized by category:

**Level Badges (20):**
1. Service Medal - Level 10
2. Service Medal - Level 25
3. Service Medal - Level 50
4. Service Medal - Level 75
5. Service Medal - Level 100
6. Prestige I, II, III, IV, V
7. XP Millionaire (1M XP)
8. XP Tycoon (5M XP)
9. XP Baron (10M XP)
10. Founder
11. Year 1 Veteran
12. Daily Devotion (100 daily missions)
13. Campaigner (25 main missions)
14. Grand Campaigner (50 main missions)
15. Dedicated (30-day login streak)

**Wealth Badges (12):**
16. High Earner (100k coins)
17. Wealthy (500k coins)
18. Coin Millionaire (1M coins)
19. Coin Baron (10M coins)
20. Big Spender (100k spent)
21. Shop VIP (1M spent)
22. Major Payout (10k single win)
23. Jackpot Winner (50k single win)
24. Richest of the Week (#1 weekly)
25. Sale Hunter (5 flash sale purchases)
26. Perk Addict (25 perks bought)
27. Fully Loaded (all perk types)

**Collection Badges (10):**
33. Pointy End (knife owned)
34. Hand-in-Glove (gloves owned)
35. Legendary Arsenal (5 legendary items)
36. Hoarder (50 inventory slots full)
37. Master of Contracts (50 trade-ups)
38. StatTrak™ Master (1000 wins on item)
39. Gambler (100 crates opened)
40. Operator (operator skin owned)

**Betting Badges (6):**
41. Untouchable (10-win streak)
42. Giant Slayer (10 underdog wins)
43. Prophet (1000 total wins)
44. The Regular (5000 total bets)
45. Predictor of the Week (#1 weekly winrate)

**Community Badges (5):**
46. Referral Master (10 referrals)
47. Community Voice (500 votes cast)
48. Moderator (staff assigned)
49. Summer Offensive 2025 (event)
50. Winter Major 2025 (event)

### ✅ 25 PERKS
Organized by category:

**XP Boosts (3):**
1. 2x XP Boost (3 Hours) - 500 coins
2. 1.5x XP Boost (24 Hours) - 1200 coins
3. Mission XP Doubler (24 Hours) - 800 coins

**Coin Boosts (1):**
4. +10% Coin Wins (24 Hours) - 600 coins

**Cosmetics (21):**
5. White Nickname Glow (7 Days) - 400 coins
6. Orange Nickname Glow (7 Days) - 500 coins
7. Purple Nickname Glow (7 Days) - 600 coins
8. Animated Profile Background (14 Days) - 1000 coins
9. Orange Chat Color (14 Days) - 700 coins
10. Supporter Chat Badge (30 Days) - 1500 coins
... and more!

### ✅ 66 ACHIEVEMENTS
Categories: betting, progression, social, special

**Examples:**
- Getting Started (first bet)
- First Victory (first win)
- Regular Bettor (50 bets)
- Consistent Winner (50 wins)
- Heating Up (3-win streak)
- Against The Odds (win with 3.0+ odds)
- Seasoned Veteran (500 bets)
- Master Predictor (250 wins)
- High Roller (10k+ payout)
- On Fire! (7-win streak)
... and 56 more!

### ✅ 61 MISSIONS
Types: daily, weekly, special, story

**Examples:**
- Daily Login
- Place a Bet
- Win a Bet
- Open a Crate
- Complete Trade-Up
- Forum Activity
- Vote in Community
- Check Leaderboard
- Customize Profile
- The First Step
... and 51 more!

### ✅ 110 ITEMS (CS2 Skins)
Organized by rarity:

**Common (20):**
- P250 | Sand Dune
- Nova | Polar Mesh
- MP7 | Army Recon
... and 17 more

**Uncommon (20):**
- Hand Wraps | Duct Tape
- Moto Gloves | Transport
- AWP | Atheris
... and 17 more

**Rare (23):**
- Bloodhound Gloves | Charred
- Hydra Gloves | Case Hardened
- AWP | Redline
- AK-47 | Redline
... and 19 more

**Epic (25):**
- Moto Gloves | Spearmint
- Hand Wraps | Cobalt Skulls
- AWP | Containment Breach
- AWP | Hyper Beast
- AWP | Asiimov
- AK-47 | The Empress
- AK-47 | Asiimov
- M4A4 | The Emperor
... and 17 more

**Legendary (22):**
- Karambit | Doppler
- Butterfly Knife | Fade
- M9 Bayonet | Lore
- Talon Knife | Slaughter
- Sport Gloves | Pandora's Box
- Specialist Gloves | Emerald Web
- AWP | Dragon Lore
- AWP | Gungnir
- AWP | Medusa
- AK-47 | Fire Serpent
- AK-47 | Wild Lotus
- M4A4 | Howl
- M4A1-S | Printstream
... and 9 more

### ✅ 5 CRATES
1. **Level Up Crate** - Awarded every level up
2. **Weekly Loyalty Crate** - Earned after 7-day login streak
3. **Prestige Crate** - Unlocked upon achieving Prestige
4. **Trade-Up Crate** - Received after successful Trade-Up Contract
5. **Summer 2025 Crate** - Limited-time seasonal event crate

---

## 🔧 INTEGRATION FILES CREATED

### Core Integration
- `src/lib/supabase-integration.ts` - Main integration (ranks, badges, perks)
- `src/lib/achievement-integration.ts` - 66 achievements system
- `src/lib/mission-integration.ts` - 61 missions system
- `src/lib/xp-leveling-system.ts` - XP and leveling

### API Routes
- `/api/ranks` - Fetch all 50 ranks
- `/api/badges` - Fetch all 68 badges
- `/api/perks` - Fetch and activate 25 perks
- `/api/achievements` - Fetch 66 achievements (already exists)
- `/api/missions` - Fetch 61 missions (already exists)
- `/api/items` - Fetch 110 items (already exists)
- `/api/leaderboard` - Rankings with XP/level

### UI Components
- `src/components/badge-display.tsx` - Display badges
- `src/components/rank-display.tsx` - Display ranks
- `src/components/xp-progress-bar.tsx` - XP progress
- `src/components/leaderboard.tsx` - Leaderboard display

---

## 📋 DATABASE SCHEMA

### Main Tables
```sql
ranks (50 rows)
  - id, name, min_level, max_level, color, icon_url
  - benefits (daily_coins, daily_gems, xp_multiplier, crate_discount)
  - is_active, created_at

badges (68 rows)
  - id, name, description, category
  - requirement_type, requirement_value
  - icon_url, rarity, is_active, created_at

perks (25 rows)
  - id, name, description, category, perk_type
  - effect_value, duration_hours
  - coin_price, gem_price
  - is_consumable, is_active, created_at

achievements (66 rows)
  - id, name, description, category
  - requirement_type, requirement_value
  - xp_reward, coin_reward, gem_reward
  - icon, rarity, created_at

missions (61 rows)
  - id, name, description, type
  - requirement_type, requirement_value
  - xp_reward, coin_reward, gem_reward
  - repeatable, created_at

items (110 rows)
  - id, name, description, type, rarity
  - value, image_url, created_at

crates (5 rows)
  - id, name, description
  - price, requires_key, created_at
```

### User Progress Tables
```sql
user_badges (0 rows) - Ready for use
user_perks (0 rows) - Ready for use
user_achievements (1 row) - Active
user_missions (0 rows) - Ready for use
```

### Other Tables
```sql
users (5 rows)
matches (0 rows)
bets (0 rows)
inventory (0 rows)
leaderboard (0 rows)
xp_log (0 rows)
chat_channels (8 rows)
chat_messages (0 rows)
transactions (0 rows)
```

### Empty Tables (Ready for Future Use)
```sql
prestige
daily_rewards
weekly_rewards
shop_items
tournaments
teams
seasons
events
```

---

## ✅ WHAT'S INTEGRATED

1. ✅ **Ranks System** - Fetch all 50 ranks, get rank by level, claim daily rewards
2. ✅ **Badges System** - Fetch all 68 badges, check requirements, award badges
3. ✅ **Perks System** - Fetch all 25 perks, activate perks, track active perks
4. ✅ **Achievements System** - Fetch 66 achievements, check progress, award achievements
5. ✅ **Missions System** - Fetch 61 missions, track progress, complete missions
6. ✅ **XP System** - Award XP, level up, calculate progress
7. ✅ **Realtime Broadcasts** - All events broadcast via Supabase Realtime

---

## 🚀 NEXT STEPS

1. Update UI components to display real data from API
2. Test badge unlocking system
3. Test mission progress tracking
4. Test perk activation
5. Test rank progression and daily rewards
6. Deploy to Vercel

---

**EVERYTHING IS IN YOUR SUPABASE DATABASE - NO HARDCODED DATA NEEDED!** 🎉
