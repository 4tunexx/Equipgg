// ARCADE GAMES DIAGNOSTIC TOOL
// Run this script in browser console on the arcade page to test all game functionality

console.log('🎮 ARCADE GAMES DIAGNOSTIC TOOL');
console.log('===============================');

// Test 1: Check Game Components Loading
function testGameComponentsLoading() {
    console.log('\n1. 🧩 GAME COMPONENTS CHECK:');
    
    // Check if game tab buttons exist
    const gameButtons = document.querySelectorAll('[role="tab"], [data-state="active"], [data-state="inactive"]');
    const crashButton = Array.from(gameButtons).find(btn => btn.textContent?.includes('Crash'));
    const coinflipButton = Array.from(gameButtons).find(btn => btn.textContent?.includes('Coinflip'));
    const plinkoButton = Array.from(gameButtons).find(btn => btn.textContent?.includes('Plinko'));
    const sweeperButton = Array.from(gameButtons).find(btn => btn.textContent?.includes('Sweeper'));
    
    console.log(`   Crash Tab: ${crashButton ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Coinflip Tab: ${coinflipButton ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Plinko Tab: ${plinkoButton ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Sweeper Tab: ${sweeperButton ? '✅ Found' : '❌ Missing'}`);
    
    // Check if recent plays table exists
    const recentPlaysTable = document.querySelector('table');
    const tableHeaders = document.querySelectorAll('th');
    const hasPlayerColumn = Array.from(tableHeaders).some(th => th.textContent?.includes('Player'));
    const hasGameColumn = Array.from(tableHeaders).some(th => th.textContent?.includes('Game'));
    const hasWinningsColumn = Array.from(tableHeaders).some(th => th.textContent?.includes('Winnings'));
    
    console.log(`   Recent Plays Table: ${recentPlaysTable ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Player Column: ${hasPlayerColumn ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Game Column: ${hasGameColumn ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Winnings Column: ${hasWinningsColumn ? '✅ Found' : '❌ Missing'}`);
    
    return {
        crashButton: !!crashButton,
        coinflipButton: !!coinflipButton,
        plinkoButton: !!plinkoButton,
        sweeperButton: !!sweeperButton,
        recentPlaysTable: !!recentPlaysTable,
        tableStructure: hasPlayerColumn && hasGameColumn && hasWinningsColumn
    };
}

// Test 2: Check Game APIs
async function testGameAPIs() {
    console.log('\n2. 🔌 GAME API TESTS:');
    
    const apiTests = [];
    
    // Test game history API
    try {
        const historyResponse = await fetch('/api/games/history', {
            credentials: 'include'
        });
        const historyStatus = historyResponse.status;
        console.log(`   Game History API: ${historyStatus === 200 ? '✅' : '❌'} Status ${historyStatus}`);
        
        if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            console.log(`   History Data Structure: ${historyData.history ? '✅' : '❌'} ${historyData.history ? 'Valid' : 'Invalid'}`);
            apiTests.push({ name: 'history', success: true, data: historyData });
        } else {
            apiTests.push({ name: 'history', success: false, status: historyStatus });
        }
    } catch (error) {
        console.log(`   Game History API: ❌ Error - ${error.message}`);
        apiTests.push({ name: 'history', success: false, error: error.message });
    }
    
    // Test user balance/auth
    try {
        const authResponse = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        const authStatus = authResponse.status;
        console.log(`   User Auth API: ${authStatus === 200 ? '✅' : '❌'} Status ${authStatus}`);
        
        if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log(`   User Data: ${authData.user ? '✅' : '❌'} ${authData.user ? 'Valid' : 'Invalid'}`);
            console.log(`   User Balance: ${authData.user?.coins ? '✅' : '❌'} ${authData.user?.coins || 'No balance'} coins`);
            apiTests.push({ name: 'auth', success: true, data: authData });
        } else {
            apiTests.push({ name: 'auth', success: false, status: authStatus });
        }
    } catch (error) {
        console.log(`   User Auth API: ❌ Error - ${error.message}`);
        apiTests.push({ name: 'auth', success: false, error: error.message });
    }
    
    return apiTests;
}

// Test 3: Test Individual Game Functionality
async function testGameFunctionality() {
    console.log('\n3. 🎯 GAME FUNCTIONALITY TESTS:');
    
    const gameTests = [];
    
    // Test each game type with the play API
    const gameTypes = ['crash', 'coinflip', 'plinko', 'sweeper'];
    
    for (const gameType of gameTypes) {
        console.log(`\n   Testing ${gameType.toUpperCase()} Game:`);
        
        try {
            // Test with minimal bet amount
            const testBet = {
                gameType: gameType,
                betAmount: 10, // Small test bet
                gameData: getGameTestData(gameType)
            };
            
            console.log(`   - Making test bet for ${gameType}...`);
            const response = await fetch('/api/games/play', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(testBet)
            });
            
            const status = response.status;
            console.log(`   - API Response: ${status === 200 ? '✅' : '❌'} Status ${status}`);
            
            if (response.ok) {
                const gameResult = await response.json();
                console.log(`   - Game Result: ${gameResult.success ? '✅' : '❌'} ${gameResult.success ? 'Valid' : 'Invalid'}`);
                console.log(`   - Result Data: ${gameResult.game ? '✅' : '❌'} ${JSON.stringify(gameResult.game?.result || {}).substring(0, 100)}...`);
                
                gameTests.push({ 
                    game: gameType, 
                    success: true, 
                    result: gameResult 
                });
            } else {
                const errorData = await response.json();
                console.log(`   - Error: ${errorData.error || 'Unknown error'}`);
                
                if (status === 401) {
                    console.log(`   - Issue: Not authenticated - please log in`);
                } else if (status === 400 && errorData.error?.includes('balance')) {
                    console.log(`   - Issue: Insufficient balance (${errorData.current} < ${errorData.required})`);
                }
                
                gameTests.push({ 
                    game: gameType, 
                    success: false, 
                    status, 
                    error: errorData.error 
                });
            }
        } catch (error) {
            console.log(`   - Network Error: ${error.message}`);
            gameTests.push({ 
                game: gameType, 
                success: false, 
                error: error.message 
            });
        }
    }
    
    return gameTests;
}

// Helper function to get test data for each game type
function getGameTestData(gameType) {
    switch (gameType) {
        case 'crash':
            return { targetMultiplier: 2.0 };
        case 'coinflip':
            return { choice: 'heads' };
        case 'plinko':
            return { difficulty: 'easy' };
        case 'sweeper':
            return { gridSize: 25, mineCount: 5, revealCount: 3 };
        default:
            return {};
    }
}

// Test 4: Check Frontend Game State
function testFrontendGameState() {
    console.log('\n4. 🖥️ FRONTEND GAME STATE:');
    
    // Check for bet amount inputs
    const betInputs = document.querySelectorAll('input[type="number"], input[placeholder*="bet"], input[placeholder*="amount"]');
    console.log(`   Bet Input Fields: ${betInputs.length > 0 ? '✅' : '❌'} Found ${betInputs.length} inputs`);
    
    // Check for game action buttons
    const gameButtons = document.querySelectorAll('button:not([role="tab"])');
    const hasPlayButton = Array.from(gameButtons).some(btn => 
        btn.textContent?.toLowerCase().includes('play') || 
        btn.textContent?.toLowerCase().includes('bet') ||
        btn.textContent?.toLowerCase().includes('start')
    );
    console.log(`   Game Action Buttons: ${hasPlayButton ? '✅' : '❌'} ${hasPlayButton ? 'Found play/bet buttons' : 'No action buttons found'}`);
    
    // Check for loading states
    const loadingElements = document.querySelectorAll('[data-loading="true"], .animate-spin, .loading');
    console.log(`   Loading States: ${loadingElements.length >= 0 ? '✅' : '❌'} Found ${loadingElements.length} loading elements`);
    
    // Check for error messages
    const errorElements = document.querySelectorAll('.error, .text-red-500, .text-destructive, [role="alert"]');
    console.log(`   Error Elements: ${errorElements.length === 0 ? '✅' : '⚠️'} Found ${errorElements.length} error indicators`);
    
    if (errorElements.length > 0) {
        errorElements.forEach((error, index) => {
            console.log(`     Error ${index + 1}: ${error.textContent?.substring(0, 100) || 'No text'}...`);
        });
    }
    
    return {
        betInputs: betInputs.length,
        hasPlayButton,
        loadingElements: loadingElements.length,
        errorElements: errorElements.length
    };
}

// Test 5: Test Game UI Interactions
function testGameUIInteractions() {
    console.log('\n5. 🖱️ GAME UI INTERACTION TESTS:');
    
    // Try clicking each game tab
    const gameTabButtons = document.querySelectorAll('[role="tab"], button[data-value]');
    const gameTabTests = [];
    
    ['crash', 'coinflip', 'plinko', 'sweeper'].forEach(gameName => {
        const tabButton = Array.from(gameTabButtons).find(btn => 
            btn.textContent?.toLowerCase().includes(gameName) ||
            btn.getAttribute('data-value') === gameName
        );
        
        if (tabButton) {
            try {
                tabButton.click();
                console.log(`   ${gameName.charAt(0).toUpperCase() + gameName.slice(1)} Tab Click: ✅ Successful`);
                gameTabTests.push({ game: gameName, success: true });
                
                // Wait a bit and check if content changed
                setTimeout(() => {
                    const gameContent = document.querySelector(`[data-value="${gameName}"], [data-state="active"]`);
                    const isActive = gameContent && (
                        gameContent.getAttribute('data-state') === 'active' ||
                        !gameContent.hidden
                    );
                    console.log(`   ${gameName.charAt(0).toUpperCase() + gameName.slice(1)} Content Load: ${isActive ? '✅' : '⚠️'} ${isActive ? 'Active' : 'Not visible'}`);
                }, 100);
                
            } catch (error) {
                console.log(`   ${gameName.charAt(0).toUpperCase() + gameName.slice(1)} Tab Click: ❌ Error - ${error.message}`);
                gameTabTests.push({ game: gameName, success: false, error: error.message });
            }
        } else {
            console.log(`   ${gameName.charAt(0).toUpperCase() + gameName.slice(1)} Tab: ❌ Button not found`);
            gameTabTests.push({ game: gameName, success: false, error: 'Button not found' });
        }
    });
    
    return gameTabTests;
}

// Main diagnostic function
async function runArcadeDiagnostics() {
    console.log('🚀 Starting Comprehensive Arcade Diagnostics...\n');
    
    // Run all tests
    const componentResults = testGameComponentsLoading();
    const apiResults = await testGameAPIs();
    const gameResults = await testGameFunctionality();
    const frontendResults = testFrontendGameState();
    const uiResults = testGameUIInteractions();
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 ARCADE DIAGNOSTICS SUMMARY');
    console.log('='.repeat(50));
    
    const componentScore = Object.values(componentResults).filter(Boolean).length;
    const apiScore = apiResults.filter(test => test.success).length;
    const gameScore = gameResults.filter(test => test.success).length;
    const uiScore = uiResults.filter(test => test.success).length;
    
    console.log(`🧩 Component Loading: ${componentScore}/6 ✅`);
    console.log(`🔌 API Functionality: ${apiScore}/${apiResults.length} ✅`);
    console.log(`🎯 Game Logic: ${gameScore}/4 ✅`);
    console.log(`🖱️ UI Interactions: ${uiScore}/4 ✅`);
    console.log(`🖥️ Frontend State: ${frontendResults.errorElements === 0 ? '✅' : '⚠️'} ${frontendResults.errorElements === 0 ? 'No errors' : frontendResults.errorElements + ' errors'}`);
    
    const totalScore = componentScore + apiScore + gameScore + uiScore;
    const maxScore = 6 + apiResults.length + 4 + 4;
    const percentage = Math.round((totalScore / maxScore) * 100);
    
    console.log(`\n🎯 Overall Score: ${totalScore}/${maxScore} (${percentage}%)`);
    
    if (percentage >= 90) {
        console.log('🎉 ARCADE IS FULLY FUNCTIONAL!');
        console.log('✅ All games are ready to play');
        console.log('✅ APIs are working correctly');
        console.log('✅ UI is responsive and interactive');
    } else if (percentage >= 70) {
        console.log('⚠️ ARCADE IS MOSTLY FUNCTIONAL');
        console.log('🔧 Some features may need attention');
        console.log('💡 Check failed tests above for specific issues');
    } else {
        console.log('❌ ARCADE NEEDS ATTENTION');
        console.log('🔧 Multiple issues detected');
        console.log('📋 Priority fixes needed:');
        
        if (apiScore < apiResults.length) {
            console.log('   - Fix API authentication/connection issues');
        }
        if (gameScore < 4) {
            console.log('   - Resolve game logic or balance issues');
        }
        if (componentScore < 6) {
            console.log('   - Fix missing UI components');
        }
    }
    
    console.log('\n📝 TROUBLESHOOTING TIPS:');
    console.log('1. Make sure you are logged in to test games');
    console.log('2. Ensure sufficient balance for game testing');
    console.log('3. Check browser console for JavaScript errors');
    console.log('4. Verify network connectivity for API calls');
    console.log('5. Try refreshing the page if components are missing');
    
    return {
        componentResults,
        apiResults,
        gameResults,
        frontendResults,
        uiResults,
        overallScore: percentage
    };
}

// Export for manual testing
window.testArcadeGames = runArcadeDiagnostics;
window.testGameAPIs = testGameAPIs;
window.testGameComponents = testGameComponentsLoading;

// Auto-run if on arcade page
if (window.location.pathname.includes('/arcade') || document.querySelector('[data-value="crash"]')) {
    console.log('🎮 Arcade page detected - running diagnostics in 2 seconds...');
    setTimeout(() => {
        runArcadeDiagnostics();
    }, 2000);
} else {
    console.log('💡 Navigate to the arcade page and run window.testArcadeGames()');
}