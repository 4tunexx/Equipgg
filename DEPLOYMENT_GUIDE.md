# Database Deployment Guide

This guide explains how to deploy the application with PostgreSQL for production while keeping sql.js for local development.

## Overview

The application supports two database backends:
- **SQLite (sql.js)**: For local development and testing
- **PostgreSQL**: For production deployment

The database abstraction layer automatically switches between backends based on the `DATABASE_TYPE` environment variable.

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp env.example .env
```

The default configuration uses SQLite:
```env
DATABASE_TYPE=sqlite
DATABASE_URL="file:./.data/equipgg.sqlite"
```

### 3. Run Setup Script
```bash
node scripts/setup-database.js
```

### 4. Start Development Server
```bash
npm run dev
```

## Production Deployment

### Option 1: Neon (Recommended)

Neon provides a serverless PostgreSQL database with a generous free tier.

#### 1. Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project

#### 2. Get Connection String
1. In your Neon dashboard, go to "Connection Details"
2. Copy the connection string (it looks like):
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

#### 3. Configure Environment
```env
DATABASE_TYPE=postgresql
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

#### 4. Deploy
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Deploy your application
npm run build
npm start
```

### Option 2: Supabase

Supabase provides a PostgreSQL database with additional features.

#### 1. Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project

#### 2. Get Connection String
1. In your Supabase dashboard, go to "Settings" > "Database"
2. Copy the connection string from "Connection string" section
3. Replace `[YOUR-PASSWORD]` with your database password

#### 3. Configure Environment
```env
DATABASE_TYPE=postgresql
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
```

#### 4. Deploy
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Deploy your application
npm run build
npm start
```

### Option 3: Self-Hosted PostgreSQL

#### 1. Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

#### 2. Create Database
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE equipgg;
CREATE USER equipgg_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE equipgg TO equipgg_user;
\q
```

#### 3. Configure Environment
```env
DATABASE_TYPE=postgresql
DATABASE_URL="postgresql://equipgg_user:your_password@localhost:5432/equipgg"
```

#### 4. Deploy
```bash
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
# Database Configuration
DATABASE_TYPE=postgresql  # or 'sqlite' for local development
DATABASE_URL="your_database_connection_string"

# NextAuth Configuration
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

### Vercel

1. **Connect Repository**
   - Connect your GitHub repository to Vercel
   - Vercel will automatically detect it's a Next.js project

2. **Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add all required environment variables
   - Make sure `DATABASE_TYPE=postgresql`

3. **Deploy**
   - Vercel will automatically deploy on every push to main branch
   - The build process will run `npx prisma generate` automatically

### Netlify

1. **Build Settings**
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"
   
   [build.environment]
     DATABASE_TYPE = "postgresql"
     NODE_VERSION = "18"
   ```

2. **Environment Variables**
   - Add environment variables in Netlify dashboard
   - Set `DATABASE_TYPE=postgresql`

3. **Deploy**
   - Connect your repository
   - Netlify will build and deploy automatically

### Railway

1. **Connect Repository**
   - Connect your GitHub repository to Railway
   - Railway will detect it's a Node.js project

2. **Environment Variables**
   - Add environment variables in Railway dashboard
   - Set `DATABASE_TYPE=postgresql`

3. **Deploy**
   - Railway will automatically deploy on every push

### Docker

1. **Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npx prisma generate
   
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
         - DATABASE_TYPE=postgresql
         - DATABASE_URL=postgresql://user:password@db:5432/equipgg
       depends_on:
         - db
     
     db:
       image: postgres:15
       environment:
         - POSTGRES_DB=equipgg
         - POSTGRES_USER=user
         - POSTGRES_PASSWORD=password
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

## Database Migrations

### Development
```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset
```

### Production
```bash
# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Testing Database Connection

### 1. Test Endpoint
Visit `/api/test-database` to test your database connection:
```bash
curl https://your-domain.com/api/test-database
```

### 2. Prisma Studio
```bash
# View database in browser
npx prisma studio
```

### 3. Database CLI
```bash
# Connect to database
npx prisma db pull

# Push schema changes
npx prisma db push
```

## Troubleshooting

### Common Issues

#### 1. Connection Timeout
```bash
# Check if database is accessible
ping your-database-host.com

# Test connection string
psql "your-connection-string"
```

#### 2. Migration Errors
```bash
# Reset migrations (development only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

#### 3. Prisma Client Issues
```bash
# Regenerate Prisma client
npx prisma generate

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. Environment Variables
```bash
# Check if variables are set
echo $DATABASE_TYPE
echo $DATABASE_URL

# Verify .env file
cat .env
```

### Performance Optimization

#### 1. Connection Pooling
For high-traffic applications, consider using connection pooling:
```env
DATABASE_URL="postgresql://user:password@host:5432/db?connection_limit=20&pool_timeout=20"
```

#### 2. Indexes
The Prisma schema includes optimized indexes. For custom queries, add additional indexes:
```sql
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_game_history_user_created ON game_history(user_id, created_at);
```

#### 3. Query Optimization
Use Prisma's query optimization features:
```typescript
// Use select to limit fields
const users = await prisma.user.findMany({
  select: { id: true, email: true, displayName: true }
});

// Use include for relations
const userWithSessions = await prisma.user.findUnique({
  where: { id: userId },
  include: { sessions: true }
});
```

## Security Considerations

### 1. Database Credentials
- Never commit database credentials to version control
- Use environment variables for all sensitive data
- Rotate credentials regularly

### 2. Connection Security
- Use SSL/TLS for database connections
- Restrict database access to application servers only
- Use strong passwords

### 3. Data Protection
- Enable database encryption at rest
- Use prepared statements to prevent SQL injection
- Implement proper access controls

## Monitoring

### 1. Database Metrics
Monitor key metrics:
- Connection count
- Query performance
- Database size
- Error rates

### 2. Application Metrics
- Response times
- Error rates
- User activity
- Resource usage

### 3. Logging
```typescript
// Enable Prisma logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

## Backup and Recovery

### 1. Automated Backups
Most cloud providers offer automated backups:
- Neon: Automatic backups with point-in-time recovery
- Supabase: Daily backups with 7-day retention
- AWS RDS: Configurable backup retention

### 2. Manual Backups
```bash
# Create backup
pg_dump "your-connection-string" > backup.sql

# Restore backup
psql "your-connection-string" < backup.sql
```

### 3. Data Migration
```bash
# Export from SQLite
sqlite3 .data/equipgg.sqlite .dump > sqlite_backup.sql

# Import to PostgreSQL (requires conversion)
# Use a tool like pgloader or custom scripts
```

This deployment guide provides comprehensive instructions for setting up the database in both development and production environments. The database abstraction layer ensures smooth switching between SQLite and PostgreSQL without code changes.
