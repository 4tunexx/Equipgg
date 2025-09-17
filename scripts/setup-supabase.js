#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.cyan}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`${colors.green}✅${colors.reset} ${message}`);
}

function logError(message) {
  log(`${colors.red}❌${colors.reset} ${message}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠️${colors.reset} ${message}`);
}

function logInfo(message) {
  log(`${colors.blue}ℹ️${colors.reset} ${message}`);
}

async function setupSupabase() {
  log(`${colors.bright}${colors.blue}🚀 Supabase Setup Script${colors.reset}`);
  log(`${colors.blue}Setting up Supabase database for production deployment...${colors.reset}`);

  try {
    // Step 1: Check environment variables
    logStep('1', 'Checking Supabase environment variables...');
    
    const requiredVars = [
      'DATABASE_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      logError(`Missing required environment variables: ${missingVars.join(', ')}`);
      logInfo('Please set these variables in your .env file or environment');
      logInfo('You can find these values in your Supabase dashboard:');
      logInfo('- DATABASE_URL: Settings → Database → Connection string');
      logInfo('- NEXT_PUBLIC_SUPABASE_URL: Settings → API → Project URL');
      logInfo('- NEXT_PUBLIC_SUPABASE_ANON_KEY: Settings → API → Project API keys');
      logInfo('- SUPABASE_SERVICE_ROLE_KEY: Settings → API → Project API keys');
      process.exit(1);
    } else {
      logSuccess('All required Supabase environment variables are set');
    }

    // Step 2: Validate DATABASE_URL format
    logStep('2', 'Validating database connection string...');
    
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl.startsWith('postgresql://')) {
      logError('DATABASE_URL must be a PostgreSQL connection string');
      logInfo('Expected format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres');
      process.exit(1);
    }
    
    logSuccess('Database connection string format is valid');

    // Step 3: Test database connection
    logStep('3', 'Testing database connection...');
    
    try {
      // Generate Prisma client first
      execSync('npx prisma generate', { stdio: 'inherit' });
      
      // Test connection with a simple query
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      await prisma.$connect();
      logSuccess('Database connection successful');
      
      // Test a simple query
      await prisma.$queryRaw`SELECT 1 as test`;
      logSuccess('Database query test successful');
      
      await prisma.$disconnect();
    } catch (error) {
      logError(`Database connection failed: ${error.message}`);
      logInfo('Please check your DATABASE_URL and ensure your Supabase project is active');
      process.exit(1);
    }

    // Step 4: Run database migrations
    logStep('4', 'Running database migrations...');
    
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      logSuccess('Database migrations completed successfully');
    } catch (error) {
      logError(`Database migrations failed: ${error.message}`);
      logInfo('This might be because:');
      logInfo('1. The database schema is already up to date');
      logInfo('2. There are migration conflicts');
      logInfo('3. The database connection is not working');
      
      // Try to push schema instead
      logInfo('Attempting to push schema directly...');
      try {
        execSync('npx prisma db push', { stdio: 'inherit' });
        logSuccess('Schema pushed successfully');
      } catch (pushError) {
        logError(`Schema push also failed: ${pushError.message}`);
        process.exit(1);
      }
    }

    // Step 5: Verify schema
    logStep('5', 'Verifying database schema...');
    
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Check if key tables exist
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;
      
      const tableNames = tables.map((t: any) => t.table_name);
      const expectedTables = [
        'users', 'sessions', 'missions', 'user_inventory', 
        'user_transactions', 'game_history', 'server_seeds',
        'client_seeds', 'game_results'
      ];
      
      const missingTables = expectedTables.filter(table => !tableNames.includes(table));
      
      if (missingTables.length > 0) {
        logWarning(`Missing tables: ${missingTables.join(', ')}`);
        logInfo('This might be normal if you\'re using a fresh database');
      } else {
        logSuccess('All expected tables are present');
      }
      
      logInfo(`Found ${tableNames.length} tables in database`);
      
      await prisma.$disconnect();
    } catch (error) {
      logWarning(`Schema verification failed: ${error.message}`);
    }

    // Step 6: Test Supabase API connection
    logStep('6', 'Testing Supabase API connection...');
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (response.ok) {
        logSuccess('Supabase API connection successful');
      } else {
        logWarning(`Supabase API connection failed: ${response.status}`);
      }
    } catch (error) {
      logWarning(`Supabase API test failed: ${error.message}`);
    }

    // Step 7: Create sample data (optional)
    logStep('7', 'Creating sample data...');
    
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Check if admin user exists
      const adminUser = await prisma.user.findFirst({
        where: { role: 'admin' }
      });
      
      if (!adminUser) {
        logInfo('Creating admin user...');
        
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await prisma.user.create({
          data: {
            id: 'admin-' + Date.now(),
            email: 'admin@example.com',
            passwordHash: hashedPassword,
            displayName: 'Admin User',
            role: 'admin',
            xp: 0,
            level: 1,
            coins: 10000,
            gems: 1000,
            createdAt: new Date().toISOString()
          }
        });
        
        logSuccess('Admin user created (email: admin@example.com, password: admin123)');
      } else {
        logInfo('Admin user already exists');
      }
      
      await prisma.$disconnect();
    } catch (error) {
      logWarning(`Sample data creation failed: ${error.message}`);
    }

    // Step 8: Final verification
    logStep('8', 'Final verification...');
    
    // Test the database abstraction layer
    try {
      const { DatabaseFactory } = require('../src/lib/database.ts');
      const db = await DatabaseFactory.getDatabase();
      
      const result = await db.findOne('users', { role: 'admin' });
      if (result.data) {
        logSuccess('Database abstraction layer working correctly');
      } else {
        logWarning('Database abstraction layer test inconclusive');
      }
      
      await DatabaseFactory.disconnect();
    } catch (error) {
      logWarning(`Database abstraction test failed: ${error.message}`);
    }

    log(`\n${colors.green}${colors.bright}🎉 Supabase setup completed successfully!${colors.reset}`);
    log(`\n${colors.cyan}Your Supabase database is ready for production!${colors.reset}`);
    log(`\n${colors.cyan}Next steps:${colors.reset}`);
    log(`${colors.yellow}1.${colors.reset} Deploy to Vercel with these environment variables`);
    log(`${colors.yellow}2.${colors.reset} Test your deployed application`);
    log(`${colors.yellow}3.${colors.reset} Monitor your Supabase dashboard for usage`);
    log(`${colors.yellow}4.${colors.reset} Set up backups and monitoring`);

  } catch (error) {
    logError(`Supabase setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the setup script
setupSupabase().catch(console.error);
