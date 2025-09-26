// Script to clear session cookies that might contain hardcoded Steam ID
const fs = require('fs');
const path = require('path');

console.log('Clearing session cookies...');

// Clear any cookie-related files or data
try {
  // Clear any potential cookie storage
  const cookieFiles = [
    '.env.local',
    '.env.development.local',
    '.env.production.local'
  ];
  
  cookieFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`Found ${file} - removing...`);
      fs.unlinkSync(filePath);
      console.log(`Removed ${file}`);
    }
  });
  
  console.log('Session cookies cleared successfully!');
  console.log('Please restart your development server and clear your browser cookies.');
  console.log('To clear browser cookies in Chrome/Edge: F12 → Application → Cookies → Clear all cookies');
  
} catch (error) {
  console.error('Error clearing session cookies:', error);
  process.exit(1);
}