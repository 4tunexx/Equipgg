# 🚀 EquipGG.net Production Deployment Guide

## Overview
This guide will help you deploy EquipGG to production using Vercel + Supabase with your domain `www.equipgg.net`.

## Prerequisites
- [ ] Vercel account
- [ ] Supabase account
- [ ] Domain `equipgg.net` configured
- [ ] GitHub repository

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project: `equipgg-production`
3. Choose region closest to your users
4. Set strong database password

### 1.2 Get Supabase Credentials
```bash
# From Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 1.3 Run Database Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 2: Vercel Setup

### 2.1 Connect GitHub Repository
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Choose framework: `Next.js`

### 2.2 Configure Environment Variables
In Vercel Dashboard > Project Settings > Environment Variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Application
NEXTAUTH_URL=https://www.equipgg.net
NEXTAUTH_SECRET=[generate-random-string]
NEXT_PUBLIC_APP_URL=https://www.equipgg.net
NEXT_PUBLIC_SOCKET_URL=https://www.equipgg.net

# Security
JWT_SECRET=[generate-random-string]
ENCRYPTION_KEY=[generate-random-string]

# External APIs
STEAM_API_KEY=[your-steam-api-key]
CSGODATABASE_API_KEY=[your-csgodatabase-api-key]

# Production Flags
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

### 2.3 Configure Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## Step 3: Domain Configuration

### 3.1 Add Domain to Vercel
1. Go to Vercel Dashboard > Project > Domains
2. Add `www.equipgg.net`
3. Add `equipgg.net` (redirects to www)

### 3.2 Configure DNS
Update your domain's DNS records:

```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## Step 4: Production Optimizations

### 4.1 Update Next.js Config
```javascript
// next.config.js
const nextConfig = {
  // ... existing config
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['sql.js']
  }
}
```

### 4.2 Enable Analytics
```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to layout.tsx
import { Analytics } from '@vercel/analytics/react'
```

### 4.3 Configure CDN
- Enable Vercel's CDN for static assets
- Configure image optimization
- Set up caching headers

## Step 5: Security & Performance

### 5.1 Security Headers
Already configured in `vercel.json`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### 5.2 Rate Limiting
```bash
# Install Upstash Redis for rate limiting
npm install @upstash/redis @upstash/ratelimit
```

### 5.3 Monitoring
```bash
# Install Sentry for error tracking
npm install @sentry/nextjs
```

## Step 6: Database Migration

### 6.1 Seed Production Database
```bash
# Create production seed script
npm run seed:production
```

### 6.2 Create Admin User
```bash
# Use the create-users endpoint
curl -X POST https://www.equipgg.net/api/create-users
```

## Step 7: Testing

### 7.1 Pre-deployment Tests
```bash
# Run production build locally
npm run build
npm run start

# Test all endpoints
npm run test:production
```

### 7.2 Post-deployment Tests
- [ ] Homepage loads
- [ ] User registration/login works
- [ ] CS2 images load correctly
- [ ] Socket.io connections work
- [ ] Database operations work
- [ ] Admin panel accessible

## Step 8: Go Live Checklist

### 8.1 Final Checks
- [ ] All environment variables set
- [ ] Database migrations complete
- [ ] SSL certificate active
- [ ] Domain redirects working
- [ ] Analytics tracking
- [ ] Error monitoring active

### 8.2 Launch
1. Deploy to Vercel
2. Update DNS records
3. Monitor for 24 hours
4. Announce launch!

## Troubleshooting

### Common Issues
1. **SQL.js WASM errors**: Ensure WASM files are included in build
2. **Database connection**: Check Supabase credentials
3. **Image loading**: Verify CSGODatabase URLs
4. **Socket.io**: Check CORS settings

### Support
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Supabase: [supabase.com/docs](https://supabase.com/docs)
- Next.js: [nextjs.org/docs](https://nextjs.org/docs)

## Success! 🎉
Your EquipGG application is now live at `www.equipgg.net`!
