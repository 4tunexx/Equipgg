// Frontend Admin Panel Diagnostic Tool
// Check for common issues that prevent admin operations

console.log('🔍 ADMIN PANEL DIAGNOSTIC TOOL');
console.log('==============================');

// Check 1: Authentication Status
function checkAuth() {
    console.log('\n1. 📝 AUTHENTICATION CHECK:');
    
    // Check cookies
    const cookies = document.cookie;
    const hasSession = cookies.includes('equipgg_session');
    console.log(`   Session Cookie: ${hasSession ? '✅ Present' : '❌ Missing'}`);
    
    // Check localStorage
    const localStorageData = Object.keys(localStorage);
    console.log(`   LocalStorage Keys: ${localStorageData.length > 0 ? localStorageData.join(', ') : 'None'}`);
    
    return hasSession;
}

// Check 2: Network Requests
async function checkNetworkRequests() {
    console.log('\n2. 🌐 NETWORK REQUEST CHECK:');
    
    try {
        // Test admin matches endpoint
        const response = await fetch('/api/admin/matches', {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log(`   GET /api/admin/matches: ${response.status} ${response.statusText}`);
        
        if (response.status === 401) {
            console.log('   ❌ UNAUTHORIZED - Check if you are logged in as admin');
            return false;
        } else if (response.status === 403) {
            console.log('   ❌ FORBIDDEN - User role is not admin');
            return false;
        } else if (response.ok) {
            console.log('   ✅ Admin API access working');
            return true;
        } else {
            console.log(`   ⚠️  Unexpected status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Network error: ${error.message}`);
        return false;
    }
}

// Check 3: Test DELETE request
async function testDeleteRequest() {
    console.log('\n3. 🗑️  DELETE REQUEST TEST:');
    
    try {
        // Create a test match first
        const createResponse = await fetch('/api/admin/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                team_a_name: 'Diagnostic Test Team A',
                team_b_name: 'Diagnostic Test Team B',
                event_name: 'Diagnostic Test Event',
                status: 'upcoming',
                match_date: new Date().toISOString().split('T')[0]
            })
        });
        
        if (!createResponse.ok) {
            console.log(`   ❌ Cannot create test match: ${createResponse.status}`);
            const errorData = await createResponse.json();
            console.log(`   Error: ${errorData.error || 'Unknown error'}`);
            return false;
        }
        
        const createData = await createResponse.json();
        console.log(`   ✅ Test match created: ID ${createData.matchId}`);
        
        // Now try to delete it
        const deleteResponse = await fetch('/api/admin/matches', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ matchId: createData.matchId })
        });
        
        if (deleteResponse.ok) {
            console.log('   ✅ DELETE request successful');
            console.log('   🎉 Match deletion functionality is working!');
            return true;
        } else {
            console.log(`   ❌ DELETE failed: ${deleteResponse.status}`);
            const errorData = await deleteResponse.json();
            console.log(`   Error: ${errorData.error || 'Unknown error'}`);
            return false;
        }
        
    } catch (error) {
        console.log(`   ❌ DELETE test error: ${error.message}`);
        return false;
    }
}

// Check 4: Browser Console Errors
function checkConsoleErrors() {
    console.log('\n4. 🐛 CONSOLE ERROR CHECK:');
    console.log('   Check the Console tab for any JavaScript errors');
    console.log('   Common issues:');
    console.log('   - CORS errors');
    console.log('   - 401/403 authentication errors');
    console.log('   - JavaScript runtime errors');
    console.log('   - Network timeout errors');
}

// Check 5: User Role Verification
async function checkUserRole() {
    console.log('\n5. 👤 USER ROLE CHECK:');
    
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const userData = await response.json();
            console.log(`   User ID: ${userData.user?.id || 'Unknown'}`);
            console.log(`   Username: ${userData.user?.username || 'Unknown'}`);
            console.log(`   Role: ${userData.user?.role || 'Unknown'}`);
            
            if (userData.user?.role === 'admin') {
                console.log('   ✅ User has admin role');
                return true;
            } else {
                console.log('   ❌ User is not admin');
                return false;
            }
        } else {
            console.log(`   ❌ Cannot fetch user data: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Error checking user role: ${error.message}`);
        return false;
    }
}

// Check 6: Frontend Event Listeners
function checkEventListeners() {
    console.log('\n6. 🎯 FRONTEND EVENT CHECK:');
    
    // Find delete buttons
    const deleteButtons = document.querySelectorAll('button[data-testid="delete-match"], button:has(.lucide-trash-2)');
    console.log(`   Delete buttons found: ${deleteButtons.length}`);
    
    if (deleteButtons.length === 0) {
        console.log('   ⚠️  No delete buttons found - might be on wrong page');
    } else {
        console.log('   ✅ Delete buttons present');
        
        // Check if buttons have click handlers
        deleteButtons.forEach((button, index) => {
            const hasClick = button.onclick !== null;
            const hasEventListeners = getEventListeners && getEventListeners(button).click?.length > 0;
            console.log(`   Button ${index + 1}: ${hasClick || hasEventListeners ? '✅ Has click handler' : '⚠️  No click handler'}`);
        });
    }
}

// Main diagnostic function
async function runDiagnostics() {
    console.log('🚀 Starting Admin Panel Diagnostics...\n');
    
    const authOK = checkAuth();
    const networkOK = await checkNetworkRequests();
    const roleOK = await checkUserRole();
    const deleteOK = await testDeleteRequest();
    
    checkConsoleErrors();
    checkEventListeners();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(50));
    console.log(`Authentication: ${authOK ? '✅' : '❌'}`);
    console.log(`Network Access: ${networkOK ? '✅' : '❌'}`);
    console.log(`Admin Role: ${roleOK ? '✅' : '❌'}`);
    console.log(`Delete Function: ${deleteOK ? '✅' : '❌'}`);
    
    if (authOK && networkOK && roleOK && deleteOK) {
        console.log('\n🎉 ALL DIAGNOSTICS PASSED!');
        console.log('✅ Admin panel should be fully functional');
        console.log('💡 If deletion still fails, check browser console for runtime errors');
    } else {
        console.log('\n🔧 ISSUES DETECTED:');
        if (!authOK) console.log('❌ Authentication issue - please log in');
        if (!networkOK) console.log('❌ Network/API issue - check server connection');
        if (!roleOK) console.log('❌ Permission issue - user needs admin role');
        if (!deleteOK) console.log('❌ Delete functionality issue - check API');
    }
    
    console.log('\n📋 TROUBLESHOOTING STEPS:');
    console.log('1. Make sure you are logged in as an admin user');
    console.log('2. Check browser Network tab during delete operation');
    console.log('3. Look for any red errors in Console tab');
    console.log('4. Try refreshing the page and attempting deletion again');
    console.log('5. Check if popup blockers are preventing confirmation dialogs');
}

// Export for use
window.adminDiagnostics = runDiagnostics;

// Auto-run if on admin page
if (window.location.pathname.includes('/dashboard/admin')) {
    console.log('🎯 Admin page detected - running diagnostics automatically');
    setTimeout(runDiagnostics, 1000);
} else {
    console.log('💡 Run window.adminDiagnostics() when on the admin page');
}