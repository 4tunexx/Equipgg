#!/usr/bin/env node

/**
 * Custom Vercel build script that runs additional fixes before the build
 * This ensures components are properly created and auth pages are simplified
 */

const { execSync } = require('child_process');
const path = require('path');

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

// Run a script with proper error handling
function runScript(scriptName) {
  const scriptPath = path.join(__dirname, scriptName);
  
  log(`\n📋 Running ${scriptName}...`, colors.yellow);
  
  try {
    execSync(`node ${scriptPath}`, { stdio: 'inherit' });
    log(`✅ ${scriptName} completed successfully`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${scriptName} failed with error: ${error.message}`, colors.red);
    return false;
  }
}

// Main function
function main() {
  log('\n🚀 Starting custom Vercel build process...', colors.bright);
  
  // Step 1: Run component verification and creation
  if (!runScript('ensure-components.js')) {
    log('❌ Component verification failed, but continuing build...', colors.yellow);
  }
  
  // Step 2: Fix auth pages with inline components
  if (!runScript('fix-auth-pages.js')) {
    log('❌ Auth page fixes failed, but continuing build...', colors.yellow);
  }
  
  // Step 3: Run the actual build command
  log('\n🔨 Running Next.js build command...', colors.bright);
  
  try {
    // Use execSync with capturing output instead of inheriting stdio
    const buildOutput = execSync('npm run build:no-lint', { 
      encoding: 'utf8', 
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer to capture large outputs
    });
    
    log('\n✅ Build completed successfully!', colors.green);
    log('\nBuild output:', colors.reset);
    console.log(buildOutput);
  } catch (error) {
    log(`\n❌ Build failed with error: ${error.message}`, colors.red);
    
    // Print out the stderr for better debugging
    if (error.stderr) {
      log('\nError output:', colors.red);
      console.error(error.stderr.toString());
    }
    
    // Print out the stdout too as it might contain useful information
    if (error.stdout) {
      log('\nStandard output:', colors.yellow);
      console.log(error.stdout.toString());
    }
    
    process.exit(1);
  }
  
  log('\n🎉 Custom build process completed!', colors.bright);
}

// Execute the script
main();
