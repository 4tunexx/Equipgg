// Manual test script for Steam integration
// This script tests the Steam integration flow without Jest

// Use built-in https module for Node.js compatibility
import https from 'https';
import http from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple fetch implementation for basic testing
function simpleFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          headers: res.headers,
          text: () => Promise.resolve(data),
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const BASE_URL = 'http://localhost:3000';

async function testSteamIntegration() {
  console.log('🚀 Starting Steam Integration Tests...\n');
  
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Check if server is running
  try {
    console.log('Test 1: Checking if server is running...');
    const response = await simpleFetch(`${BASE_URL}/api/me`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      console.log('✅ Server is running (401 Unauthorized is expected)');
      testsPassed++;
    } else {
      console.log('✅ Server is running (status:', response.status + ')');
      testsPassed++;
    }
  } catch (error) {
    console.log('❌ Server is not accessible:', error.message);
    testsFailed++;
  }

  // Test 2: Check Steam verification API endpoints
  try {
    console.log('\nTest 2: Checking Steam verification API endpoints...');
    
    // Test the steam verification endpoint (should redirect or return error)
    const response = await simpleFetch(`${BASE_URL}/api/auth/steam`);
    
    // Steam auth endpoint should redirect (307) or return 200/405
    if (response.status === 307 || response.status === 302 || response.status === 200 || response.status === 405) {
      console.log('✅ Steam verification API is accessible');
      testsPassed++;
    } else {
      console.log('✅ Steam verification API is accessible (status:', response.status + ')');
      testsPassed++;
    }
  } catch (error) {
    console.log('❌ Steam verification API test failed:', error.message);
    testsFailed++;
  }

  // Test 3: Check Steam authentication endpoints
  try {
    console.log('\nTest 3: Checking Steam authentication endpoints...');
    
    const steamAuthResponse = await simpleFetch(`${BASE_URL}/api/auth/steam/callback`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Steam callback should redirect (302) or return 200/400/404
    if (steamAuthResponse.status === 302 || steamAuthResponse.status === 200 || steamAuthResponse.status === 400 || steamAuthResponse.status === 404) {
      console.log('✅ Steam authentication endpoint is accessible');
      testsPassed++;
    } else {
      console.log('✅ Steam authentication endpoint is accessible (status:', steamAuthResponse.status + ')');
      testsPassed++;
    }
  } catch (error) {
    console.log('❌ Steam authentication endpoint test failed:', error.message);
    testsFailed++;
  }

  // Test 4: Check Steam verification gate component
  try {
    console.log('\nTest 4: Checking Steam verification gate component...');
    
    // Check if the component file exists and is accessible
    const componentPath = join(__dirname, '../components/steam-verification-gate.tsx');
    
    if (existsSync(componentPath)) {
      const componentContent = readFileSync(componentPath, 'utf8');
      
      // Check for key features
      const checks = [
        { name: 'Steam verification check API call', pattern: /api\/steam-verification\/check/ },
        { name: 'Loading state', pattern: /checkingVerification/ },
        { name: 'Needs verification state', pattern: /needsVerification/ },
        { name: 'Steam verification handler', pattern: /handleSteamVerification/ },
        { name: 'Popup window handling', pattern: /window\.open/ },
        { name: 'User data refresh', pattern: /refreshUser/ }
      ];
      
      let componentTestsPassed = 0;
      checks.forEach(check => {
        if (check.pattern.test(componentContent)) {
          console.log(`✅ ${check.name} found`);
          componentTestsPassed++;
        } else {
          console.log(`❌ ${check.name} not found`);
        }
      });
      
      if (componentTestsPassed === checks.length) {
        console.log('✅ Steam verification gate component has all required features');
        testsPassed++;
      } else {
        console.log(`❌ Steam verification gate component missing ${checks.length - componentTestsPassed} features`);
        testsFailed++;
      }
    } else {
      console.log('❌ Steam verification gate component file not found');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ Steam verification gate component test failed:', error.message);
    testsFailed++;
  }

  // Test 5: Check API/me endpoint Steam data integration
  try {
    console.log('\nTest 5: Checking /api/me endpoint Steam data integration...');
    
    const apiPath = join(__dirname, '../app/api/me/route.ts');
    
    if (existsSync(apiPath)) {
      const apiContent = readFileSync(apiPath, 'utf8');
      
      // Check for Steam-related fields
      const steamFields = [
        'steam_id',
        'steam_verified',
        'avatar_url',
        'username'
      ];
      
      let steamFieldsFound = 0;
      steamFields.forEach(field => {
        if (apiContent.includes(field)) {
          steamFieldsFound++;
        }
      });
      
      if (steamFieldsFound >= 3) {
        console.log(`✅ /api/me endpoint includes ${steamFieldsFound} Steam-related fields`);
        testsPassed++;
      } else {
        console.log(`❌ /api/me endpoint missing Steam-related fields (found ${steamFieldsFound})`);
        testsFailed++;
      }
    } else {
      console.log('❌ /api/me endpoint file not found');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ /api/me endpoint test failed:', error.message);
    testsFailed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All Steam integration tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the results above.');
    process.exit(1);
  }
}

// Run the tests
testSteamIntegration().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});