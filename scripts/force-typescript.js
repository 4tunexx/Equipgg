const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Checking TypeScript installation...');

// Check TypeScript but don't force install in resource-constrained environments
try {
  execSync('npm list typescript', { stdio: 'ignore' });
  console.log('✅ TypeScript is installed');
} catch (e) {
  console.log('📦 TypeScript not in list, but build will continue...');
}

console.log('✅ TypeScript check complete');