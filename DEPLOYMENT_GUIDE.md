# Deployment Guide

This guide explains how to deploy the application with Supabase for both development and production environments.

## Overview

The application uses Supabase as its primary database and authentication provider. This ensures consistency between development and production environments.

## Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp env.supabase.example .env
```

Configure your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL="your-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-key"
```

### 3. Run Setup Script
```bash
node scripts/setup-supabase.js
```

### 4. Start Development Server
```bash
npm run dev
```

## Production Deployment

### Supabase Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Sign up/Login to your account
   - Create a new project
   - Note down your project URL and API keys

2. **Configure Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

3. **Database Migrations**
   ```bash
   # Install Supabase CLI
   npm install supabase --save-dev

   # Login to Supabase
   npx supabase login

   # Link your project
   npx supabase link --project-ref your-project-ref

   # Push database changes
   npx supabase db push
   ```
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Deploy your application
npm run build
npm start
```

## Environment Variables

### Required Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Next.js Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-domain.com"

# Socket.io Configuration
SOCKET_IO_URL="https://your-domain.com"
```

### Optional Variables
```env
# Steam Authentication
STEAM_API_KEY="your-steam-api-key"

# Payment Configuration
STRIPE_PUBLIC_KEY=""
STRIPE_SECRET_KEY=""
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""

# Email Configuration
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
```

## Deployment Platforms

### Vercel (Recommended)

1. **Connect Repository**
   - Connect your GitHub repository to Vercel
   - Vercel will automatically detect it's a Next.js project

2. **Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add all required Supabase environment variables
   - Add other required environment variables

3. **Deploy**
   - Vercel will automatically deploy on every push to main branch
   - The build process will handle all necessary setup

### Docker

1. **Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   ```

2. **Docker Compose**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
         - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
         - SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Testing Database Connection

### 1. Test Endpoint
Visit `/api/test-database` to test your database connection:
```bash
curl https://your-domain.com/api/test-database
```

### 2. Supabase Dashboard
1. Go to your project dashboard at [supabase.com](https://supabase.com)
2. Navigate to Database → Table Editor
3. Verify tables and data are present

## Monitoring and Debugging

### 1. Supabase Dashboard
Monitor key metrics through the Supabase dashboard:
- Database usage
- API requests
- Authentication events
- Error logs

### 2. Application Monitoring
Enable detailed logging in your application:
```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true
    },
    db: {
      schema: 'public'
    }
  }
);
```

## Security Best Practices

### 1. API Keys and Environment Variables
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Regularly rotate your Supabase API keys

### 2. Row Level Security (RLS)
Enable RLS policies in Supabase to control data access:
```sql
-- Example RLS policy
CREATE POLICY "Users can only access their own data"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);
```

### 3. Data Protection
- Enable database encryption at rest (enabled by default in Supabase)
- Use prepared statements to prevent SQL injection
- Implement proper access controls through RLS

## Backup and Recovery

### 1. Automated Backups
Supabase provides automated backups:
- Daily backups with point-in-time recovery
- Configurable backup retention
- Backup restoration through dashboard

### 2. Manual Backups
You can create manual backups through the Supabase dashboard:
1. Go to Project Settings → Database
2. Click "Backups"
3. Choose "Create Backup"

## Troubleshooting

### Common Issues

#### 1. Connection Issues
- Verify your Supabase URL and API keys
- Check if the project is active in Supabase dashboard
- Ensure proper CORS configuration in Supabase settings

#### 2. Authentication Problems
- Verify environment variables are correctly set
- Check authentication configuration in Supabase dashboard
- Review browser console for CORS errors

#### 3. Database Errors
- Check row level security policies
- Review database schema in Supabase dashboard
- Monitor error logs in Supabase console

This deployment guide provides comprehensive instructions for setting up and deploying your application with Supabase. Follow the security best practices and monitoring recommendations to ensure a robust production environment.
