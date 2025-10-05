// Quick API Test for Match Deletion
// Run this in browser console on the admin page

async function testMatchDeletionAPI() {
    console.log('🧪 TESTING MATCH DELETION API DIRECTLY');
    console.log('=====================================');
    
    try {
        // Step 1: Get current matches
        console.log('1️⃣ Fetching current matches...');
        const getResponse = await fetch('/api/admin/matches', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`GET Response Status: ${getResponse.status}`);
        
        if (!getResponse.ok) {
            const errorData = await getResponse.json();
            console.log('❌ GET Failed:', errorData);
            return;
        }
        
        const matchesData = await getResponse.json();
        console.log(`✅ Found ${matchesData.matches?.length || 0} matches`);
        
        if (!matchesData.matches || matchesData.matches.length === 0) {
            console.log('⚠️ No matches to delete. Creating a test match first...');
            
            // Create a test match
            const createResponse = await fetch('/api/admin/matches', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    team_a_name: 'API Test Team A',
                    team_b_name: 'API Test Team B', 
                    event_name: 'API Test Event',
                    status: 'upcoming',
                    match_date: new Date().toISOString().split('T')[0]
                })
            });
            
            if (!createResponse.ok) {
                const createError = await createResponse.json();
                console.log('❌ CREATE Failed:', createError);
                return;
            }
            
            const createData = await createResponse.json();
            console.log(`✅ Test match created with ID: ${createData.matchId}`);
            
            // Step 2: Now delete the created match
            console.log('2️⃣ Deleting the test match...');
            const deleteResponse = await fetch('/api/admin/matches', {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ matchId: createData.matchId })
            });
            
            console.log(`DELETE Response Status: ${deleteResponse.status}`);
            
            if (deleteResponse.ok) {
                const deleteData = await deleteResponse.json();
                console.log('🎉 DELETE SUCCESSFUL:', deleteData);
                console.log('✅ Match deletion API is working correctly!');
            } else {
                const deleteError = await deleteResponse.json();
                console.log('❌ DELETE FAILED:', deleteError);
                
                // Check common issues
                if (deleteResponse.status === 401) {
                    console.log('🔐 Issue: Not authenticated - please log in');
                } else if (deleteResponse.status === 403) {
                    console.log('🚫 Issue: Not authorized - user needs admin role');
                } else {
                    console.log('⚠️ Issue: Server error or other problem');
                }
            }
        } else {
            // Use the first existing match for testing
            const testMatch = matchesData.matches[0];
            console.log(`2️⃣ Testing deletion with existing match: ${testMatch.id}`);
            console.log(`   Match: ${testMatch.team_a_name} vs ${testMatch.team_b_name}`);
            
            const confirmDelete = confirm(`Delete test match "${testMatch.team_a_name} vs ${testMatch.team_b_name}"? This is for testing purposes.`);
            
            if (confirmDelete) {
                const deleteResponse = await fetch('/api/admin/matches', {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ matchId: testMatch.id })
                });
                
                console.log(`DELETE Response Status: ${deleteResponse.status}`);
                
                if (deleteResponse.ok) {
                    const deleteData = await deleteResponse.json();
                    console.log('🎉 DELETE SUCCESSFUL:', deleteData);
                    console.log('✅ Match deletion API is working correctly!');
                } else {
                    const deleteError = await deleteResponse.json();
                    console.log('❌ DELETE FAILED:', deleteError);
                    
                    // Check common issues
                    if (deleteResponse.status === 401) {
                        console.log('🔐 Issue: Not authenticated - please log in');
                    } else if (deleteResponse.status === 403) {
                        console.log('🚫 Issue: Not authorized - user needs admin role');
                    } else {
                        console.log('⚠️ Issue: Server error or other problem');
                    }
                }
            } else {
                console.log('⏭️ Deletion cancelled by user');
            }
        }
        
    } catch (error) {
        console.log('❌ NETWORK ERROR:', error.message);
        console.log('🔧 Possible issues:');
        console.log('   - Server is down');
        console.log('   - Network connectivity problems');
        console.log('   - CORS issues');
        console.log('   - JavaScript execution errors');
    }
}

// Make it available globally
window.testMatchDeletionAPI = testMatchDeletionAPI;

console.log('🎯 Match Deletion API Tester Loaded');
console.log('📋 Usage: Run testMatchDeletionAPI() in console');
console.log('💡 Make sure you are on the admin page and logged in as admin');

// Auto-run if we're on admin page
if (window.location.pathname.includes('/dashboard/admin')) {
    console.log('🚀 Auto-running API test in 2 seconds...');
    setTimeout(() => {
        testMatchDeletionAPI();
    }, 2000);
}