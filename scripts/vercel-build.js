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

async function vercelBuild() {
  log(`${colors.bright}${colors.blue}🚀 Vercel Build Script${colors.reset}`);
  log(`${colors.blue}Preparing application for Vercel deployment...${colors.reset}`);

  try {
    // Step 1: Check environment variables
    logStep('1', 'Checking environment variables...');
    
    const requiredEnvVars = [
      'DATABASE_TYPE',
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      logWarning(`Missing environment variables: ${missingVars.join(', ')}`);
      logWarning('Make sure to set these in your Vercel dashboard');
    } else {
      logSuccess('All required environment variables are set');
    }

    // Step 2: Build Next.js application
    logStep('2', 'Building Next.js application...');
    try {
      execSync('next build', { stdio: 'inherit' });
      logSuccess('Next.js build completed');
    } catch (error) {
      logError('Next.js build failed');
      throw error;
    }

    // Step 5: Verify build output
    logStep('5', 'Verifying build output...');
    
    const buildDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(buildDir)) {
      logSuccess('Build output directory exists');
      
      // Check for key files
      const keyFiles = ['server.js', 'static', 'server'];
      keyFiles.forEach(file => {
        const filePath = path.join(buildDir, file);
        if (fs.existsSync(filePath)) {
          logSuccess(`Found ${file} in build output`);
        } else {
          logWarning(`Missing ${file} in build output`);
        }
      });
    } else {
      logError('Build output directory not found');
      throw new Error('Build failed - no output directory');
    }

    // Step 6: Check for common issues
    logStep('6', 'Checking for common deployment issues...');
    
    // Check if server.js exists in root
    const serverFile = path.join(process.cwd(), 'server.js');
    if (fs.existsSync(serverFile)) {
      logSuccess('Custom server.js found');
    } else {
      logWarning('No custom server.js found - using Next.js default server');
    }

    // Check package.json scripts
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.scripts && packageJson.scripts.start) {
      logSuccess('Start script found in package.json');
    } else {
      logWarning('No start script found in package.json');
    }

    // Step 7: Environment-specific checks
    logStep('7', 'Running environment-specific checks...');
    
    if (process.env.VERCEL) {
      logSuccess('Running in Vercel environment');
      
      // Check Vercel-specific environment variables
      if (process.env.VERCEL_URL) {
        logSuccess(`Vercel URL: ${process.env.VERCEL_URL}`);
      }
      
      if (process.env.VERCEL_ENV) {
        logSuccess(`Vercel Environment: ${process.env.VERCEL_ENV}`);
      }
    } else {
      logWarning('Not running in Vercel environment');
    }

    // Step 8: Final verification
    logStep('8', 'Final verification...');
    
    // Check if all required files exist
    const requiredFiles = [
      'package.json',
      'next.config.js',
      'vercel.json'
    ];
    
    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        logSuccess(`Found ${file}`);
      } else {
        logWarning(`Missing ${file}`);
      }
    });

    log(`\n${colors.green}${colors.bright}🎉 Vercel build completed successfully!${colors.reset}`);
    log(`\n${colors.cyan}Next steps:${colors.reset}`);
    log(`${colors.yellow}1.${colors.reset} Deploy to Vercel: \`vercel --prod\``);
    log(`${colors.yellow}2.${colors.reset} Set environment variables in Vercel dashboard`);
    log(`${colors.yellow}3.${colors.reset} Test your deployed application`);
    log(`${colors.yellow}4.${colors.reset} Monitor logs in Vercel dashboard`);

  } catch (error) {
    logError(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the build script
vercelBuild().catch(console.error);
