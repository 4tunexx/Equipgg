# Vercel Deployment Guide with Supabase

This guide will walk you through deploying your application to Vercel with Supabase as the database provider.

## 🚀 **Prerequisites**

Before starting, make sure you have:
- [Vercel account](https://vercel.com) (free tier available)
- [Supabase account](https://supabase.com) (free tier available)
- [GitHub account](https://github.com) (for repository hosting)
- Your application code ready in a Git repository

## 📋 **Step 1: Set Up Supabase Database**

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `equipgg` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

### 1.2 Get Database Connection Details
1. In your Supabase dashboard, go to **Settings** → **Database**
2. Copy the **Connection string** (URI format)
3. It should look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
4. Also note down:
   - **Project URL**: `https://[PROJECT-REF].supabase.co`
   - **Anon Key**: Found in **Settings** → **API**
   - **Service Role Key**: Found in **Settings** → **API**

### 1.3 Set Up Database Schema
1. In your local project, update your `.env` file:
   ```env
   DATABASE_TYPE=postgresql
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```

2. Run the database setup:
  ```bash
  npm run supabase:setup
  # Or use Supabase dashboard/CLI for migrations
  ```

## 🔧 **Step 2: Prepare Your Application**

### 2.1 Update Environment Variables
Create a `.env.local` file for local testing with production database:
```env
# Database
DATABASE_TYPE=postgresql
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-here-minimum-32-characters"
NEXTAUTH_URL="http://localhost:9003"

# Socket.io
SOCKET_IO_URL="http://localhost:9003"

# Steam (if using)
STEAM_API_KEY="your-steam-api-key"
```

### 2.2 Test Local Connection
```bash
# Test the database connection
npm run dev
# Visit http://localhost:9003/test-database
```

### 2.3 Build Test
```bash
# Test the build process
npm run build
```

## 🌐 **Step 3: Deploy to Vercel**

### 3.1 Connect Repository to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository:
   - Connect your GitHub account if not already connected
   - Select your repository
   - Click "Import"

### 3.2 Configure Build Settings
Vercel should auto-detect Next.js, but verify these settings:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (default)
- **Build Command**: `npm run vercel:build`
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install`

### 3.3 Set Environment Variables
In the Vercel dashboard, go to **Settings** → **Environment Variables** and add:

#### Required Variables:
```env
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
NEXTAUTH_SECRET=your-super-secret-key-here-minimum-32-characters
NEXTAUTH_URL=https://your-app.vercel.app
SOCKET_IO_URL=https://your-app.vercel.app
```

#### Supabase Variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

#### Optional Variables:
```env
STEAM_API_KEY=your-steam-api-key
STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://your-app.vercel.app/api
```

### 3.4 Deploy
1. Click "Deploy" in Vercel
2. Wait for the build to complete (2-5 minutes)
3. Your app will be available at `https://your-app.vercel.app`

## 🔍 **Step 4: Post-Deployment Verification**

### 4.1 Test Database Connection
1. Visit `https://your-app.vercel.app/test-database`
2. Verify all tests pass
3. Check that the database type shows "postgresql"

### 4.2 Test Core Features
1. **Authentication**: Try signing up/signing in
2. **Database Operations**: Test creating/reading data
3. **Socket.io**: Test real-time features
4. **API Endpoints**: Test various API routes

### 4.3 Check Logs
1. In Vercel dashboard, go to **Functions** tab
2. Check for any errors in the logs
3. Monitor performance and response times

## 🛠️ **Step 5: Production Optimizations**

### 5.1 Enable Vercel Analytics
1. In Vercel dashboard, go to **Analytics**
2. Enable Web Analytics
3. Add to your app (optional):
   ```typescript
   import { Analytics } from '@vercel/analytics/react';
   
   export default function App() {
     return (
       <>
         {/* Your app */}
         <Analytics />
       </>
     );
   }
   ```

### 5.2 Set Up Custom Domain (Optional)
1. In Vercel dashboard, go to **Domains**
2. Add your custom domain
3. Configure DNS settings as instructed
4. Update environment variables with new domain

### 5.3 Configure Edge Functions (Optional)
For better performance, you can move some API routes to Edge Functions:
```typescript
// api/hello.ts
export const config = {
  runtime: 'edge',
};

export default function handler(req: Request) {
  return new Response('Hello from Edge!');
}
```

## 🔒 **Step 6: Security & Monitoring**

### 6.1 Set Up Monitoring
1. **Vercel Monitoring**: Built-in performance monitoring
2. **Sentry**: Add error tracking:
   ```bash
   npm install @sentry/nextjs
   ```
3. **LogRocket**: Add session replay (optional)

### 6.2 Security Headers
Add security headers in `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 6.3 Rate Limiting
Consider adding rate limiting for API routes:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
```

## 📊 **Step 7: Database Management**

### 7.1 Supabase Dashboard
- **Table Editor**: Manage your data
- **SQL Editor**: Run custom queries
- **API Docs**: Auto-generated API documentation
- **Auth**: Manage user authentication
- **Storage**: File storage (if needed)

### 7.2 Database Backups
Supabase automatically handles backups, but you can:
1. Export data manually from the dashboard
2. Set up automated backups (Pro plan)
3. Use Supabase CLI for local development

### 7.3 Performance Monitoring
- **Supabase Dashboard**: Monitor database performance
- **Vercel Analytics**: Monitor application performance
- **Database Logs**: Check for slow queries

## 🚨 **Troubleshooting**

### Common Issues:

#### 1. Build Failures
```bash
# Check build logs in Vercel dashboard
# Common fixes:
npm run build        # Test build locally
```

#### 2. Database Connection Issues
```bash
# Verify connection string format
# Check environment variables in Vercel
# Test connection locally first
```

#### 3. Environment Variable Issues
- Ensure all required variables are set in Vercel
- Check variable names match exactly
- Verify no extra spaces or quotes

#### 4. Socket.io Issues
- Ensure `SOCKET_IO_URL` matches your Vercel domain
- Check CORS settings
- Verify Socket.io server is running

### Debug Commands:
```bash


# Check environment variables
vercel env ls

# View deployment logs
vercel logs

# Test build locally
npm run vercel:build
```

## 📈 **Scaling Considerations**

### 1. Database Scaling
- **Supabase Pro**: Higher limits and better performance
- **Connection Pooling**: Configure for high traffic
- **Read Replicas**: For read-heavy workloads

### 2. Application Scaling
- **Vercel Pro**: Higher function limits and better performance
- **Edge Functions**: Move compute closer to users
- **CDN**: Automatic with Vercel

### 3. Monitoring & Alerts
- Set up alerts for errors and performance issues
- Monitor database usage and costs
- Track user metrics and engagement

## 🎉 **Deployment Complete!**

Your application is now deployed to Vercel with Supabase! 

### Next Steps:
1. **Test thoroughly** in production environment
2. **Set up monitoring** and alerts
3. **Configure custom domain** (optional)
4. **Set up CI/CD** for automatic deployments
5. **Monitor performance** and optimize as needed

### Useful Links:
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

### Support:
- [Vercel Support](https://vercel.com/support)
- [Supabase Support](https://supabase.com/support)
- [GitHub Issues](https://github.com/your-repo/issues)

Happy deploying! 🚀
