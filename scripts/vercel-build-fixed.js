#!/usr/bin/env node

/**
 * Modified Vercel build script that ensures UI components are available
 */

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

function logWarning(message) {
  log(`${colors.yellow}⚠️${colors.reset} ${message}`);
}

function logError(message) {
  log(`${colors.red}❌${colors.reset} ${message}`);
}

function executeCommand(command) {
  try {
    log(`Executing: ${command}`, colors.blue);
    const output = execSync(command, { encoding: 'utf8' });
    return output.trim();
  } catch (error) {
    logError(`Command failed: ${command}`);
    logError(error.message);
    process.exit(1);
  }
}

// Check environment
logStep('1', 'Checking environment');
const isVercelBuild = process.env.VERCEL === '1';
log(`Building on Vercel: ${isVercelBuild ? 'Yes' : 'No'}`);
log(`Node version: ${process.version}`);
log(`Working directory: ${process.cwd()}`);

// Verify critical paths exist
logStep('2', 'Verifying critical paths');
const COMPONENTS_DIR = path.join(process.cwd(), 'src', 'components');
const UI_DIR = path.join(COMPONENTS_DIR, 'ui');

// Ensure UI components directory exists
if (!fs.existsSync(UI_DIR)) {
  logWarning(`UI components directory not found: ${UI_DIR}`);
  fs.mkdirSync(UI_DIR, { recursive: true });
  logSuccess('Created UI components directory');
}

// Run our component verification script
logStep('3', 'Running component verification');
executeCommand('node scripts/ensure-components.js');

// Build the application
logStep('4', 'Building the application');
executeCommand('next build');

logStep('5', 'Build completed');
logSuccess('Deployment build completed successfully');