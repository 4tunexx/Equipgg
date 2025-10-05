# 🚨 CRITICAL DATABASE SCHEMA MISMATCHES FOUND

## Missing Tables (Used by APIs but not in schema):

### 1. **trade_history**
- **Used in:** `/api/trading/users/route.ts`, `/api/trading/offers/route.ts`
- **Purpose:** Track completed trades between users
- **Status:** ❌ MISSING - Causes 500 errors in trading features

### 2. **trade_offer_items**
- **Used in:** `/api/trading/offers/route.ts`
- **Purpose:** Items offered in trade proposals
- **Status:** ❌ MISSING - Trading system broken

### 3. **trade_offer_requests**
- **Used in:** `/api/trading/offers/route.ts`
- **Purpose:** Items requested in trade proposals
- **Status:** ❌ MISSING - Trading system broken

### 4. **match_predictions**
- **Used in:** `/api/voting/cast/route.ts`
- **Purpose:** User predictions on match outcomes
- **Status:** ❌ MISSING - Voting/prediction features broken

## Missing Columns (Used by APIs but not in schema):

### 1. **users.vip_tier**
- **Used in:** `/api/user/upgrade-vip/route.ts`, `/api/create-users/route.ts`
- **Purpose:** User VIP subscription level
- **Status:** ❌ MISSING - VIP system broken

### 2. **users.vip_expires_at**
- **Used in:** `/api/user/upgrade-vip/route.ts`
- **Purpose:** VIP subscription expiration date
- **Status:** ❌ MISSING - VIP system broken

### 3. **users.balance**
- **Used in:** `/api/create-users/route.ts`
- **Purpose:** Alternative to coins field
- **Status:** ❌ MISSING - May cause user balance issues

### 4. **users.last_login**
- **Used in:** `/api/create-users/route.ts`
- **Purpose:** Track user activity
- **Status:** ❌ MISSING - Uses last_login_at instead

### 5. **users.is_active**
- **Used in:** `/api/create-users/route.ts`
- **Purpose:** User account status
- **Status:** ❌ MISSING - Uses account_status instead

### 6. **matches.title**, **matches.team1_name**, **matches.team2_name**, **matches.scheduled_at**
- **Used in:** `/api/voting/results/route.ts`, `/api/voting/cast/route.ts`
- **Purpose:** Match display information
- **Status:** ❌ MISSING - Uses team_a_name, team_b_name, match_date instead
- **Solution:** Add column aliases or update API to use correct fields

### 7. **users.displayName** vs **users.displayname**
- **Used in:** Multiple APIs use inconsistent casing
- **Purpose:** User display name
- **Status:** 🟡 INCONSISTENT - Database has `displayname` (lowercase), APIs sometimes expect `displayName`
- **Solution:** Standardize on `displayname` (lowercase) throughout codebase

## Impact Assessment:

### 🔴 **CRITICAL FEATURES BROKEN:**
1. **Trading System** - Cannot create, manage, or complete trades
2. **VIP Subscriptions** - Cannot upgrade, check, or manage VIP status
3. **Match Predictions** - Cannot submit or track predictions
4. **User Management** - API inconsistencies may cause errors

### 🟡 **MINOR ISSUES:**
1. **Column Name Inconsistencies** - Some APIs use different field names
2. **Data Display** - Some fields may not display correctly

## Required Actions:

1. **Add Missing Tables** - Create trade_history, trade_offer_items, trade_offer_requests, match_predictions
2. **Add Missing Columns** - Add VIP fields to users table
3. **Fix Column References** - Update APIs to use correct field names
4. **Test All Features** - Verify everything works after fixes

## Database Schema Additions Needed:

```sql
-- Add VIP columns to users table
ALTER TABLE users ADD COLUMN vip_tier TEXT DEFAULT 'none';
ALTER TABLE users ADD COLUMN vip_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN balance INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_login TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Add missing match columns (aliases/views needed)
-- match.title -> can use event_name
-- match.team1_name -> team_a_name  
-- match.team2_name -> team_b_name
-- match.scheduled_at -> match_date + start_time

-- Create missing trading tables
CREATE TABLE trade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_offer_id UUID,
    sender_id TEXT REFERENCES users(id),
    receiver_id TEXT REFERENCES users(id),
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    items_exchanged JSONB
);

CREATE TABLE trade_offer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID REFERENCES trade_offers(id),
    item_id TEXT,
    quantity INTEGER DEFAULT 1
);

CREATE TABLE trade_offer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID REFERENCES trade_offers(id),  
    item_id TEXT,
    quantity INTEGER DEFAULT 1
);

CREATE TABLE match_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id),
    match_id UUID REFERENCES matches(id),
    prediction TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```