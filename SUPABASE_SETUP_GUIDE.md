# 🗄️ Supabase Setup Guide for EquipGG

## Quick Setup (5 minutes)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `equipgg-production`
   - **Database Password**: `[Create strong password - save this!]`
   - **Region**: `us-east-1` (or closest to your users)
   - **Plan**: Free tier

### 2. Get Your Credentials
Go to **Settings > API** and copy:

```bash
# Project URL
https://your-project-ref.supabase.co

# Anon Key (public)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (secret)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Create Environment File
Copy `env.supabase.example` to `.env.local`:

```bash
cp env.supabase.example .env.local
```

Edit `.env.local` with your actual values:

```bash
# Replace these with your actual values:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

### 4. Setup Database
Run the production setup script:

```bash
npm run supabase:production
```

This will:
- ✅ Check environment variables
- ✅ Generate Prisma client
- ✅ Push database schema
- ✅ Create default users
- ✅ Test database connection

### 5. Default Users Created
After setup, you'll have these users:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@equipgg.net | admin123 |
| Moderator | moderator@equipgg.net | moderator123 |
| Test User | test@equipgg.net | test123 |

## Troubleshooting

### Common Issues:

**1. "Missing environment variables"**
- Make sure `.env.local` exists and has all required variables
- Check that you copied the correct values from Supabase

**2. "Database connection failed"**
- Verify your DATABASE_URL is correct
- Check that your Supabase project is active
- Ensure your database password is correct

**3. "Prisma client generation failed"**
- Run `npm install` to ensure all dependencies are installed
- Try `npx prisma generate` manually

**4. "Schema push failed"**
- Check your Supabase project permissions
- Verify your service role key has the right permissions

## Next Steps

Once Supabase is set up:

1. **Deploy to Vercel** with the same environment variables
2. **Configure your domain** (www.equipgg.net)
3. **Test the production deployment**

## Security Notes

- 🔒 Keep your service role key secret
- 🔒 Use strong passwords for database
- 🔒 Enable Row Level Security (RLS) in Supabase
- 🔒 Set up proper database backups

## Support

- [Supabase Docs](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Vercel Docs](https://vercel.com/docs)
