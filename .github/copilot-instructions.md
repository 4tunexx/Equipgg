# EquipGG - CS2 Gaming Platform Copilot Instructions

EquipGG is a Next.js 15.3.3 TypeScript application with Supabase backend, designed as a CS2 virtual betting and gaming platform with real-time features powered by Socket.io.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Prerequisites and Environment Setup
- Install Node.js 20.19.5+ and npm 10.8.2+
- Copy environment configuration:
  ```bash
  cp env.supabase.example .env.local
  # Edit .env.local with your actual Supabase credentials
  ```

### Essential Development Commands
- **Install dependencies**: `npm install` -- takes 60 seconds with dependency warnings (normal). NEVER CANCEL.
- **Development server**: `npm run dev` -- starts on port 9003 in ~5 seconds
- **Production build**: `npm run build` -- completes in 19 seconds with TypeScript warnings (ignored by config)
- **Production server**: `npm run start` -- runs production build on port 9003
- **Type checking**: `npm run typecheck` -- shows TypeScript errors but doesn't block builds
- **Linting**: `npm run lint` -- shows many warnings/errors but doesn't block development

### Database Setup (Supabase Required)
- **Setup script**: `node scripts/setup-supabase.js` -- requires valid Supabase credentials
- **Database environment variables** (required for full functionality):
  ```
  DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
  NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
  SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
  ```

## Build and Test Information

### Build Process
- **Build command**: `npm run build` -- completes in 19 seconds
- **Build warnings**: TypeScript errors are ignored via `next.config.js` settings
- **No timeout needed**: Build is fast and reliable
- **Output**: Standalone Next.js build in `.next` directory

### Test Suite
- **Test command**: `npm run test` -- CURRENTLY BROKEN due to Jest/ES module configuration
- **Test runner**: Jest with TypeScript support
- **Issue**: Cannot use import statements outside module scope in jest.setup.ts
- **DO NOT**: Try to fix test configuration unless specifically asked to work on tests

### Linting and Code Quality
- **Linter**: ESLint with Next.js config
- **Current state**: Many TypeScript warnings (unused variables, any types)
- **Behavior**: Warnings don't block development or deployment
- **Best practice**: Run `npm run lint` before committing but don't expect zero warnings

## Application Architecture

### Key Directories
- `src/app/` - Next.js 13+ app router pages and API routes
- `src/components/` - React components including UI library
- `src/lib/` - Utility functions, database queries, and shared logic
- `src/sockets/` - Socket.io event handlers for real-time features
- `src/types/` - TypeScript type definitions
- `scripts/` - Database setup and deployment scripts

### Core Features
- **Authentication**: Supabase Auth with Steam integration
- **Real-time**: Socket.io for live chat, betting, notifications
- **Database**: Supabase PostgreSQL for all data persistence
- **UI**: Radix UI components with Tailwind CSS styling
- **Games**: CS2 skin betting, crate opening, match prediction

### Important Files
- `server.js` - Custom server combining Next.js with Socket.io
- `next.config.js` - Build configuration with security headers
- `scripts/setup-supabase.js` - Database initialization script
- `src/lib/supabase/queries.ts` - Database query layer

## Validation Scenarios

### After Making Changes - ALWAYS Test These
1. **Basic functionality**:
   ```bash
   npm run build  # Must complete without errors
   npm run dev    # Must start on localhost:9003
   curl http://localhost:9003  # Must return 200
   ```

2. **Application health checks**:
   - Homepage loads with gaming UI elements
   - Dashboard redirects properly (307 response)
   - API endpoints respond (test `/api/test-simple`)
   - Socket.io server initializes correctly

3. **Development workflow**:
   - Pages hot-reload correctly
   - TypeScript compilation warnings are expected
   - Build completes with standalone output

### Manual User Scenarios
1. **Homepage access**: Visit localhost:9003 - should show gaming platform UI
2. **Authentication flow**: Sign-in/sign-up pages load (may need Supabase for full function)
3. **Dashboard access**: Redirects to profile page correctly
4. **API availability**: Simple API routes return proper responses

## Common Issues and Solutions

### Build Failures
- **Duplicate exports**: Check for multiple `export default` statements in pages
- **Missing environment variables**: Use dummy values for build testing
- **Supabase errors**: Build may fail if trying to connect to database during build

### Development Issues
- **Port conflicts**: Default port is 9003, not standard 3000
- **Socket.io**: Custom server.js handles both Next.js and Socket.io
- **Hot reload**: Works correctly in development mode

### Database Connection
- **Supabase setup**: Requires valid credentials, cannot be mocked
- **Environment file**: Must have .env.local with proper Supabase config
- **Fallback**: Application has some local storage fallbacks for development

## Project Configuration

### Environment Files
- `.env.local` - Development environment (you create)
- `env.supabase.example` - Template for Supabase configuration
- `env.production.example` - Template for production deployment

### Build Configuration
- **TypeScript**: Errors ignored during builds (`ignoreBuildErrors: true`)
- **ESLint**: Ignored during builds (`ignoreDuringBuilds: true`)
- **Output**: Standalone mode for Vercel deployment
- **Security**: Comprehensive security headers configured

### Development vs Production
- **Development**: Uses `npm run dev` with `server.js`
- **Production**: Uses `npm run start` with built Next.js app
- **Database**: Supabase in all environments (no local SQLite)

## Critical Reminders

- **NEVER CANCEL** the `npm install` command - it takes 60 seconds and has expected warnings
- **TypeScript errors are expected** - the build configuration ignores them
- **Tests are currently broken** - don't attempt to fix without specific requirements
- **Supabase credentials required** - for full database functionality
- **Port 9003** - not the standard Next.js port 3000
- **Custom server** - uses server.js, not standard Next.js server

## Deployment Notes

The application has comprehensive deployment guides:
- `VERCEL_DEPLOYMENT_GUIDE.md` - Vercel deployment with Supabase
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - Production deployment guide
- `DEPLOYMENT_READY_SUMMARY.md` - Current deployment status

Always build and test locally before deployment to ensure compatibility.