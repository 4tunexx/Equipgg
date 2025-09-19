# 🚨 Vercel Deployment Issues - Quick Fix Guide

## 📊 **Current Issues from Logs**

### ✅ **Fixed Issues:**
1. **Database Column Names**: Fixed `displayName` → `display_name` 
2. **Missing Tables**: Fixed `user_activity_feed` → `activity_feed`

### 🔴 **Remaining Issues:**

#### **1. Authentication 503 Errors**
```
api/auth/login - 503 Service Unavailable
api/auth/register - 503 Service Unavailable  
```

#### **2. API Endpoints Failing**
```
api/matches - 503 Service Unavailable
api/landing/featured-items - 503 Service Unavailable
api/site-settings - 503 Service Unavailable
```

## 🔧 **Required Environment Variables in Vercel**

**Go to your Vercel Dashboard → Project Settings → Environment Variables**

### **Critical Variables (Must Have):**
```env
# Database Connection
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DATABASE_TYPE=postgresql

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Authentication 
NEXTAUTH_SECRET=MF5Cf0qL8vZj7KtQq9pRn2XwB1yUeA6sY3HxV8mN0dS4CgW7FzTk
NEXTAUTH_URL=https://your-vercel-app.vercel.app

# Security
ENCRYPTION_KEY=50824cf1dc3d4549634a86c1956ac798621f10d706b79506a7d48f3debd5201a
```

### **External APIs:**
```env
PANDASCORE_API_KEY=your_pandascore_api_key
STEAM_API_KEY=your_steam_api_key
```

## 🔍 **Diagnostic Steps**

### **1. Check Supabase Connection**
1. Go to your Supabase dashboard
2. Go to Settings → API
3. Copy your **Project URL** and **anon key**
4. Go to Settings → Database  
5. Copy your **Connection string**
6. Make sure these match your Vercel environment variables

### **2. Verify Tables Exist**
In Supabase SQL Editor, run:
```sql
-- Check if required tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'activity_feed', 'matches', 'site_settings');

-- Check users table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public';
```

### **3. Test Environment Variables**
Visit your deployment URL + `/api/test-database` to verify connection.

## 🚀 **Quick Fix Commands**

**Redeploy with fixes:**
```bash
git add .
git commit -m "fix: Database schema and table name corrections"
git push origin main
```

## 📋 **Environment Variable Checklist**

- [ ] `DATABASE_URL` - Supabase connection string
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `NEXTAUTH_SECRET` - Authentication secret
- [ ] `NEXTAUTH_URL` - Your Vercel app URL
- [ ] `ENCRYPTION_KEY` - Data encryption key

## 🔄 **After Adding Environment Variables**

1. **Redeploy**: Vercel will auto-redeploy when you push changes
2. **Check Logs**: Monitor Vercel function logs for errors
3. **Test Auth**: Try logging in via your deployment URL
4. **Verify API**: Check if `/api/me` returns valid response

## 🆘 **If Still Not Working**

**Check these common issues:**
1. **Wrong Supabase Region**: Make sure connection string matches your project region
2. **Missing RLS Policies**: Ensure Row Level Security is configured properly
3. **Database Migrations**: Run Supabase migrations if tables are missing
4. **API Rate Limits**: Check if any APIs are hitting rate limits

**Next Steps:**
1. Add all environment variables to Vercel
2. Push this fix to trigger new deployment  
3. Check deployment logs for remaining errors
4. Test authentication and API endpoints