#!/usr/bin/env node

/**
 * This script ensures that all UI components are properly available
 * during the Vercel build process to fix path resolution issues.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define paths
const ROOT_DIR = path.resolve(__dirname, '..');
const COMPONENTS_DIR = path.join(ROOT_DIR, 'src', 'components');
const UI_DIR = path.join(COMPONENTS_DIR, 'ui');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Check if directories exist
function checkDirectory(dir) {
  if (!fs.existsSync(dir)) {
    log(`Directory does not exist: ${dir}`, colors.red);
    log(`Creating directory: ${dir}`, colors.yellow);
    fs.mkdirSync(dir, { recursive: true });
    return false;
  }
  return true;
}

// Check specific UI components that are being imported
function checkComponents() {
  const requiredComponents = [
    'button.tsx',
    'input.tsx',
    'label.tsx',
    'card.tsx'
  ];
  
  let allComponentsExist = true;
  
  for (const component of requiredComponents) {
    const componentPath = path.join(UI_DIR, component);
    if (!fs.existsSync(componentPath)) {
      log(`Missing UI component: ${component}`, colors.red);
      allComponentsExist = false;
    } else {
      log(`Found UI component: ${component}`, colors.green);
    }
  }
  
  return allComponentsExist;
}

// Check for auth provider
function checkAuthProvider() {
  const authProviderPath = path.join(COMPONENTS_DIR, 'auth-provider.tsx');
  if (!fs.existsSync(authProviderPath)) {
    log(`Missing auth provider: auth-provider.tsx`, colors.red);
    return false;
  }
  log(`Found auth provider: auth-provider.tsx`, colors.green);
  return true;
}

// Run diagnostics on path resolution
function checkPathResolution() {
  log('\nChecking path resolution and Next.js configuration...', colors.bright);
  
  try {
    // Check tsconfig
    if (fs.existsSync(path.join(ROOT_DIR, 'tsconfig.json'))) {
      log('Found tsconfig.json', colors.green);
      const tsconfig = require(path.join(ROOT_DIR, 'tsconfig.json'));
      if (tsconfig?.compilerOptions?.paths?.['@/*']) {
        log('Path alias @/* is correctly configured in tsconfig.json', colors.green);
      } else {
        log('Path alias @/* may not be correctly configured in tsconfig.json', colors.yellow);
      }
    }
    
    // Check components.json
    if (fs.existsSync(path.join(ROOT_DIR, 'components.json'))) {
      log('Found components.json', colors.green);
    }
    
    // Check next.config.js
    if (fs.existsSync(path.join(ROOT_DIR, 'next.config.js'))) {
      log('Found next.config.js', colors.green);
    }
    
    // Check for .env files
    if (fs.existsSync(path.join(ROOT_DIR, '.env'))) {
      log('Found .env file', colors.green);
    }
    
  } catch (error) {
    log(`Error checking path resolution: ${error.message}`, colors.red);
  }
}

// Main function
function main() {
  log('\n===== UI Component Verification =====', colors.bright);
  
  checkDirectory(COMPONENTS_DIR);
  checkDirectory(UI_DIR);
  
  const componentsExist = checkComponents();
  const authProviderExists = checkAuthProvider();
  
  checkPathResolution();
  
  if (!componentsExist || !authProviderExists) {
    log('\n⚠️ Missing components detected. This may cause build failures.', colors.yellow);
    // List directory contents for debugging
    try {
      log('\nComponents directory contents:', colors.bright);
      const components = fs.readdirSync(COMPONENTS_DIR);
      components.forEach(item => log(` - ${item}`));
      
      log('\nUI components directory contents:', colors.bright);
      const uiComponents = fs.readdirSync(UI_DIR);
      uiComponents.forEach(item => log(` - ${item}`));
    } catch (error) {
      log(`Error listing directory contents: ${error.message}`, colors.red);
    }
  } else {
    log('\n✅ All required components verified', colors.green);
  }
  
  log('\n===================================\n', colors.bright);
}

// Execute the script
main();