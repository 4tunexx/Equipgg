# EquipGG Development Instructions

Always follow these instructions first and only fallback to additional search and context gathering if the information here is incomplete or found to be in error.

## Working Effectively

### Bootstrap and Setup
- Install dependencies: `npm install` -- takes 63 seconds. NEVER CANCEL.
- Copy environment: `cp env.example .env` for local development
- For Supabase production: `cp env.supabase.example .env`
- Setup database (if using Supabase): `node scripts/setup-supabase.js`

### Build and Development
- Start development server: `npm run dev` -- runs on http://localhost:9003 with Socket.io
- Alternative Next.js only: `npm run dev:next` -- runs on port 9003
- Production build: `npm run build` -- CURRENTLY FAILS due to duplicate exports. Set timeout to 30+ minutes if fixed.
- Start production: `npm run start` or `npm run start:production`

### Code Quality and Validation
- Run linting: `npm run lint` -- takes 7 seconds, currently has 169 ESLint errors. NEVER CANCEL.
- Run type checking: `npm run typecheck` -- takes 5 seconds, currently has 104 TypeScript errors. NEVER CANCEL.
- Run tests: `npm test` -- CURRENTLY FAILS due to Jest configuration issues. Set timeout to 15+ minutes if fixed.

## Complete NPM Scripts Reference

### Development Scripts
- `npm run dev` -- Custom server with Socket.io (recommended)
- `npm run dev:next` -- Pure Next.js with Turbopack (alternative)
- `npm run genkit:dev` -- AI genkit development server
- `npm run genkit:watch` -- AI genkit with watch mode

### Build Scripts
- `npm run build` -- Standard Next.js build (currently fails)
- `npm run build:production` -- Production environment build
- `npm run vercel:build` -- Custom Vercel build script with validation

### Production Scripts
- `npm start` -- Start custom server (same as npm run dev in production)
- `npm run start:next` -- Start Next.js built application
- `npm run start:production` -- Production server with environment

### Testing Scripts
- `npm test` -- Run Jest tests (currently broken)
- `npm run test:watch` -- Jest in watch mode
- `npm run test:coverage` -- Jest with coverage report

### Code Quality Scripts
- `npm run lint` -- ESLint validation
- `npm run typecheck` -- TypeScript type checking

### Vercel Deployment Scripts
- `npm run vercel:dev` -- Local Vercel development
- `npm run vercel:deploy` -- Deploy to production
- `npm run vercel:preview` -- Deploy preview version

## Current Status and Known Issues

### Critical Issues That Prevent Building
1. **Duplicate exports in auth pages**: `src/app/(auth)/sign-in/page.tsx` and `src/app/(auth)/sign-up/page.tsx` have duplicate default exports
2. **Missing UI component imports**: Card, Button, Input, Label components not properly imported
3. **Jest configuration issues**: Import statement errors prevent test execution
4. **TypeScript errors**: 104 type errors across 25 files, mainly missing imports and type mismatches

### Working Components
- ✅ Development server runs successfully on port 9003
- ✅ Socket.io integration working
- ✅ Custom server.js with Next.js integration
- ✅ Dependency installation works
- ✅ Environment configuration system
- ✅ Supabase setup scripts
- ✅ Vercel deployment configuration

## Build Times and Timeouts

### NEVER CANCEL - Required Timeouts
- `npm install`: 63 seconds -- Set timeout to 120+ seconds
- `npm run lint`: 7 seconds -- Set timeout to 30+ seconds  
- `npm run typecheck`: 5 seconds -- Set timeout to 30+ seconds
- `npm run build`: Currently fails in 17 seconds -- Set timeout to 60+ minutes when fixed
- `npm test`: Currently fails in 2 seconds -- Set timeout to 30+ minutes when fixed

## Validation Scenarios

### Before Making Changes
1. Run `npm install` to ensure dependencies are current
2. Start development server with `npm run dev` and verify it runs on http://localhost:9003
3. Check that Socket.io connection logs appear: "Socket.io server initialized with modular handlers"
4. **CRITICAL**: Without proper Supabase configuration, the app will show "Invalid supabaseUrl: Provided URL is malformed" error

### Environment Setup Required for Validation
- **Local development**: Use `cp env.example .env` and set `DATABASE_TYPE=sqlite`
- **Supabase development**: Use `cp env.supabase.example .env` and configure Supabase URLs
- **Without proper env**: App will crash with Supabase URL error (this is expected behavior)

### After Making Changes
1. ALWAYS run `npm run lint` and `npm run typecheck` before completing work
2. Test development server restart: Stop and restart `npm run dev`
3. Test core functionality by visiting key pages (requires proper environment setup):
   - Homepage: http://localhost:9003
   - Test database: http://localhost:9003/test-database
   - Test Socket.io: http://localhost:9003/test-socket

### Required Fix Validation
When fixing build issues, ALWAYS test these scenarios:
1. `npm run build` completes without errors
2. `npm run start` successfully serves the built application
3. Core features work: authentication, database connection, Socket.io

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15.3.3 with App Router
- **Runtime**: Node.js 20.19.5, npm 10.8.2
- **Database**: Supabase (PostgreSQL) or SQLite for development
- **Real-time**: Socket.io with custom server.js
- **Styling**: Tailwind CSS with Radix UI components
- **Testing**: Jest with React Testing Library (currently broken)
- **Deployment**: Vercel with custom build process

### Key Directories
- `src/app/`: Next.js App Router pages and API routes
- `src/components/`: React components including UI components
- `src/lib/`: Core utilities, database abstraction, configurations
- `src/sockets/`: Socket.io event handlers
- `src/test/`: Test files (currently non-functional)
- `scripts/`: Build and setup scripts
- `public/`: Static assets

### Environment Configuration
- **Development**: Uses `.env` file, SQLite database, local Socket.io
- **Production**: Uses Supabase, environment variables in Vercel
- **Key variables**: DATABASE_URL, SUPABASE keys, NEXTAUTH_SECRET, Socket.io URL

## Common Issues and Solutions

### Build Failures
- **Duplicate exports**: Remove duplicate default export functions in auth pages
- **Missing imports**: Add proper imports for UI components from @/components/ui
- **TypeScript errors**: Most are due to missing type definitions and imports

### Development Issues
- **Port conflicts**: Default port is 9003, not 3000
- **Socket.io connection**: Requires custom server.js, not Next.js default server
- **Database connection**: Ensure environment variables are properly set
- **Runtime error without env**: "Invalid supabaseUrl: Provided URL is malformed" when environment is not configured

### Deployment Issues
- **Vercel build**: Use `npm run vercel:build` instead of default build
- **Environment variables**: Must be set in Vercel dashboard for production
- **Custom server**: Uses server.js for Socket.io integration

## Security Notes
- Keep Supabase service role keys secret
- Use NEXTAUTH_SECRET for session security
- CORS configured for Socket.io connections
- Security headers configured in next.config.js

## Important File Management

### Files Always Excluded (.gitignore)
- Environment files: `.env*` (contains secrets)
- Build outputs: `.next/`, `out/`, `dist/`, `build/`
- Database files: `*.db`, `*.sqlite*`
- Dependencies: `node_modules/`
- IDE files: `.vscode/`, `.idea/`
- Temporary files: `*.tmp`, `*.temp`

### Files to Include in Commits
- Source code: `src/`
- Configuration: `package.json`, `next.config.js`, `vercel.json`
- Documentation: `*.md` files
- Environment examples: `env.example`, `env.*.example`
- Scripts: `scripts/`

## Documentation References
- Main deployment guides: `PRODUCTION_DEPLOYMENT_GUIDE.md`, `VERCEL_DEPLOYMENT_GUIDE.md`
- Database setup: `SUPABASE_SETUP_GUIDE.md`, `DATABASE_MIGRATION_SUMMARY.md`
- Configuration: `env.example`, `env.supabase.example`, `vercel.json`
- Issue tracking: `FIXES_SUMMARY.md`, `DEPLOYMENT_READY_SUMMARY.md`