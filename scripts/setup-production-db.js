#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

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

async function main() {
  log(`${colors.bright}${colors.magenta}🚀 EquipGG Production Database Setup${colors.reset}`);
  log(`${colors.blue}Setting up Supabase PostgreSQL database for production...${colors.reset}`);

  // Check if environment variables are set
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  logStep('1', 'Checking environment variables...');
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logError(`Missing required environment variables: ${missingVars.join(', ')}`);
    logWarning('Please set these in your .env.local file or environment');
    log('\nRequired variables:');
    missingVars.forEach(varName => {
      log(`  - ${varName}`);
    });
    process.exit(1);
  }
  
  logSuccess('All required environment variables are set');

  // Check if Prisma is installed
  logStep('2', 'Checking Prisma installation...');
  try {
    execSync('npx prisma --version', { stdio: 'pipe' });
    logSuccess('Prisma is installed');
  } catch (error) {
    logError('Prisma is not installed. Installing...');
    execSync('npm install prisma @prisma/client', { stdio: 'inherit' });
    logSuccess('Prisma installed');
  }

  // Generate Prisma client
  logStep('3', 'Generating Prisma client...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    logSuccess('Prisma client generated');
  } catch (error) {
    logError('Failed to generate Prisma client');
    console.error(error.message);
    process.exit(1);
  }

  // Push database schema
  logStep('4', 'Pushing database schema to Supabase...');
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    logSuccess('Database schema pushed to Supabase');
  } catch (error) {
    logError('Failed to push database schema');
    console.error(error.message);
    process.exit(1);
  }

  // Seed the database
  logStep('5', 'Seeding production database...');
  try {
    // Create a simple seed script for production
    const seedScript = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding production database...');
  
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@equipgg.net' },
    update: {},
    create: {
      id: 'admin-123-456-789',
      email: 'admin@equipgg.net',
      password_hash: adminPassword,
      displayName: 'Admin User',
      role: 'admin',
      xp: 0,
      level: 1,
      coins: 0,
      gems: 50,
      createdAt: new Date(),
      created_at: new Date().toISOString()
    }
  });
  console.log('✅ Admin user created:', admin.email);

  // Create moderator user
  const moderatorPassword = await bcrypt.hash('moderator123', 10);
  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@equipgg.net' },
    update: {},
    create: {
      id: 'moderator-123-456-789',
      email: 'moderator@equipgg.net',
      password_hash: moderatorPassword,
      displayName: 'Moderator User',
      role: 'moderator',
      xp: 0,
      level: 1,
      coins: 0,
      gems: 25,
      createdAt: new Date(),
      created_at: new Date().toISOString()
    }
  });
  console.log('✅ Moderator user created:', moderator.email);

  // Create test user
  const testPassword = await bcrypt.hash('test123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@equipgg.net' },
    update: {},
    create: {
      id: 'test-123-456-789',
      email: 'test@equipgg.net',
      password_hash: testPassword,
      displayName: 'Test User',
      role: 'user',
      xp: 0,
      level: 1,
      coins: 1000,
      gems: 10,
      createdAt: new Date(),
      created_at: new Date().toISOString()
    }
  });
  console.log('✅ Test user created:', testUser.email);

  console.log('🎉 Production database seeded successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

    // Write and run the seed script
    fs.writeFileSync('temp-seed.js', seedScript);
    execSync('node temp-seed.js', { stdio: 'inherit' });
    fs.unlinkSync('temp-seed.js');
    
    logSuccess('Production database seeded');
  } catch (error) {
    logError('Failed to seed database');
    console.error(error.message);
    process.exit(1);
  }

  // Test database connection
  logStep('6', 'Testing database connection...');
  try {
    const testScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const userCount = await prisma.user.count();
  console.log(\`✅ Database connection successful! Found \${userCount} users.\`);
  await prisma.$disconnect();
}

test().catch(console.error);
`;
    
    fs.writeFileSync('temp-test.js', testScript);
    execSync('node temp-test.js', { stdio: 'inherit' });
    fs.unlinkSync('temp-test.js');
    
    logSuccess('Database connection test passed');
  } catch (error) {
    logError('Database connection test failed');
    console.error(error.message);
    process.exit(1);
  }

  log(`\n${colors.bright}${colors.green}🎉 Production Database Setup Complete!${colors.reset}`);
  log(`\n${colors.cyan}Next steps:${colors.reset}`);
  log('1. Deploy to Vercel with these environment variables');
  log('2. Configure your domain (www.equipgg.net)');
  log('3. Test the production deployment');
  log(`\n${colors.yellow}Default users created:${colors.reset}`);
  log('• Admin: admin@equipgg.net / admin123');
  log('• Moderator: moderator@equipgg.net / moderator123');
  log('• Test: test@equipgg.net / test123');
}

main().catch(console.error);
