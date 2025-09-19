# 🧹 Database Migration Guide - Fresh Start

## 🚨 **IMPORTANT: This will delete all existing data!**

Follow these steps to clean up your Supabase database and apply the correct schema:

## **Step 1: Backup (Optional)**
If you have any important data, export it first:
1. Go to Supabase Dashboard → Database → Tables
2. Export any important tables

## **Step 2: Clean Up Database**
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of: `supabase/migrations/00_cleanup_database.sql`
4. Click **"Run"** to execute
5. You should see: "Cleanup completed. Ready for fresh migration."

## **Step 3: Apply Fresh Schema**
1. In the same SQL Editor
2. Copy and paste the contents of: `supabase/migrations/production_schema.sql`
3. Click **"Run"** to execute
4. This will create all tables with correct structure

## **Step 4: Verify Tables Created**
Check that these tables exist with correct columns:

### ✅ **users** table should have:
- `id` (UUID)
- `email` (TEXT)
- `display_name` (TEXT) ← **Not displayName!**
- `username` (TEXT)
- `steam_id` (TEXT)
- `avatar_url` (TEXT)
- `role` (user_role enum)
- `coins`, `gems`, `xp`, `level`
- And more...

### ✅ **matches** table should have:
- `id` (TEXT)
- `pandascore_id` (INTEGER)
- `team_a_name`, `team_b_name` (TEXT)
- `team_a_odds`, `team_b_odds` (DECIMAL)
- `status` (match_status enum)
- And more...

### ✅ **activity_feed** table should have:
- `id` (UUID)
- `user_id` (UUID)
- `username` (TEXT)
- `activity_type` (TEXT)
- `amount`, `item_name`, etc.

## **Step 5: Test Connection**
After migration, test your deployment:
1. Deploy/redeploy your Vercel app
2. Check if login/registration works
3. Verify API endpoints respond correctly
4. Check leaderboard loads

## **Step 6: Common Issues & Solutions**

### **If you see "column doesn't exist" errors:**
- Make sure you ran the cleanup script first
- Verify the production schema was applied completely
- Check column names are snake_case (display_name, not displayName)

### **If you see "table doesn't exist" errors:**
- Make sure the production schema created all tables
- Check RLS policies are applied
- Verify indexes were created

### **If authentication doesn't work:**
- Check environment variables in Vercel
- Verify NEXTAUTH_SECRET and Supabase keys are correct
- Test with a simple test user

## **Environment Variables Checklist**
After database migration, ensure these are set in Vercel:

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DATABASE_TYPE=postgresql

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Auth
NEXTAUTH_SECRET=MF5Cf0qL8vZj7KtQq9pRn2XwB1yUeA6sY3HxV8mN0dS4CgW7FzTk
NEXTAUTH_URL=https://your-vercel-app.vercel.app

# External APIs
PANDASCORE_API_KEY=your_api_key
STEAM_API_KEY=your_api_key
ENCRYPTION_KEY=50824cf1dc3d4549634a86c1956ac798621f10d706b79506a7d48f3debd5201a
```

## **🎉 Success Indicators**
After completing all steps, you should have:
- ✅ All tables created with correct structure
- ✅ No "column doesn't exist" errors
- ✅ Login/registration working
- ✅ Leaderboard displaying users
- ✅ API endpoints responding
- ✅ PandaScore integration ready

## **Next Steps After Migration**
1. Push your latest code to trigger Vercel deployment
2. Test all functionality
3. Add some test data through your app
4. Sync matches from PandaScore API
5. Your EquipGG platform should be fully operational!

---

**🔄 Ready to proceed with the cleanup and migration?**