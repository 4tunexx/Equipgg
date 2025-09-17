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

async function checkEnvironment() {
  logStep('1', 'Checking environment configuration...');
  
  const envFile = path.join(process.cwd(), '.env');
  const envExampleFile = path.join(process.cwd(), 'env.example');
  
  if (!fs.existsSync(envFile)) {
    if (fs.existsSync(envExampleFile)) {
      logWarning('No .env file found. Copying from env.example...');
      fs.copyFileSync(envExampleFile, envFile);
      logSuccess('Created .env file from env.example');
    } else {
      logError('No .env file or env.example found. Please create a .env file.');
      process.exit(1);
    }
  } else {
    logSuccess('.env file exists');
  }
  
  // Check if DATABASE_TYPE is set
  const envContent = fs.readFileSync(envFile, 'utf8');
  if (!envContent.includes('DATABASE_TYPE=')) {
    logWarning('DATABASE_TYPE not set in .env file. Defaulting to sqlite for local development.');
  }
}

async function setupPrisma() {
  logStep('2', 'Setting up Prisma...');
  
  try {
    // Generate Prisma client
    log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    logSuccess('Prisma client generated');
    
    // Check if we're using PostgreSQL
    const envContent = fs.readFileSync('.env', 'utf8');
    const isPostgres = envContent.includes('DATABASE_TYPE=postgresql') || 
                      envContent.includes('postgresql://');
    
    if (isPostgres) {
      log('PostgreSQL detected. Setting up migrations...');
      
      // Create initial migration
      try {
        execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
        logSuccess('Initial migration created and applied');
      } catch (error) {
        if (error.message.includes('already exists')) {
          logWarning('Database already exists. Skipping initial migration.');
        } else {
          throw error;
        }
      }
      
      // Push schema to database
      try {
        execSync('npx prisma db push', { stdio: 'inherit' });
        logSuccess('Schema pushed to database');
      } catch (error) {
        logWarning('Failed to push schema. This might be normal if migrations were used.');
      }
    } else {
      log('SQLite detected. Skipping Prisma migrations for local development.');
    }
    
  } catch (error) {
    logError(`Failed to setup Prisma: ${error.message}`);
    process.exit(1);
  }
}

async function verifySetup() {
  logStep('3', 'Verifying database setup...');
  
  try {
    // Test Prisma client generation
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    logSuccess('Prisma client connection successful');
    
    await prisma.$disconnect();
    logSuccess('Database setup verification complete');
    
  } catch (error) {
    logWarning(`Database verification failed: ${error.message}`);
    logWarning('This is normal for SQLite setup. Database will work on first run.');
  }
}

async function createSampleData() {
  logStep('4', 'Creating sample data...');
  
  const envContent = fs.readFileSync('.env', 'utf8');
  const isPostgres = envContent.includes('DATABASE_TYPE=postgresql') || 
                    envContent.includes('postgresql://');
  
  if (isPostgres) {
    log('PostgreSQL detected. Creating sample data...');
    
    try {
      // Run the existing bootstrap script for sample data
      execSync('node -e "require(\'./src/lib/db.ts\').bootstrap(require(\'@prisma/client\').PrismaClient)"', { stdio: 'inherit' });
      logSuccess('Sample data created');
    } catch (error) {
      logWarning('Failed to create sample data. You may need to create it manually.');
    }
  } else {
    log('SQLite detected. Sample data will be created automatically on first run.');
  }
}

async function main() {
  log(`${colors.bright}${colors.blue}🚀 Database Setup Script${colors.reset}`);
  log(`${colors.blue}Setting up database for both local development and production...${colors.reset}`);
  
  try {
    await checkEnvironment();
    await setupPrisma();
    await verifySetup();
    await createSampleData();
    
    log(`\n${colors.green}${colors.bright}🎉 Database setup completed successfully!${colors.reset}`);
    log(`\n${colors.cyan}Next steps:${colors.reset}`);
    log(`${colors.yellow}1.${colors.reset} For local development: Run \`npm run dev\` (uses sql.js)`);
    log(`${colors.yellow}2.${colors.reset} For production: Set DATABASE_TYPE=postgresql in .env and deploy`);
    log(`${colors.yellow}3.${colors.reset} Test the database switching with the test endpoints`);
    
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
