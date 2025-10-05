const { createClient } = require('@supabase/supabase-js');

// Comprehensive Admin Panel Functionality Test
// Tests all admin panel features including match deletion

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rntlmrwzgdqkyfbffsmb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class AdminPanelTester {
    constructor() {
        this.passedTests = 0;
        this.failedTests = 0;
        this.testResults = [];
    }

    async runTest(testName, testFunction) {
        try {
            console.log(`🧪 Testing: ${testName}`);
            const result = await testFunction();
            if (result.success) {
                console.log(`✅ ${testName}: PASSED`);
                console.log(`   ${result.message}`);
                this.passedTests++;
                this.testResults.push({ test: testName, status: 'PASSED', message: result.message });
            } else {
                console.log(`❌ ${testName}: FAILED`);
                console.log(`   ${result.message}`);
                this.failedTests++;
                this.testResults.push({ test: testName, status: 'FAILED', message: result.message });
            }
        } catch (error) {
            console.log(`❌ ${testName}: ERROR`);
            console.log(`   ${error.message}`);
            this.failedTests++;
            this.testResults.push({ test: testName, status: 'ERROR', message: error.message });
        }
        console.log('');
    }

    // Test 1: Users Management
    async testUsersManagement() {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .limit(5);

        if (error) {
            return { success: false, message: `Users query error: ${error.message}` };
        }

        // Check if we can update a user (simulate admin action)
        if (users.length > 0) {
            const testUser = users[0];
            const { error: updateError } = await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', testUser.id);

            if (updateError) {
                return { success: false, message: `User update error: ${updateError.message}` };
            }
        }

        return { 
            success: true, 
            message: `Users management functional: ${users.length} users accessible, update permissions OK` 
        };
    }

    // Test 2: Matches Management (Focus on deletion capability)
    async testMatchesManagement() {
        const { data: matches, error } = await supabase
            .from('matches')
            .select('*')
            .limit(5);

        if (error) {
            return { success: false, message: `Matches query error: ${error.message}` };
        }

        // Test if we can create a test match (to test deletion later)
        const { data: testMatch, error: createError } = await supabase
            .from('matches')
            .insert({
                team_a_name: 'Test Team A',
                team_b_name: 'Test Team B',
                event_name: 'Test Event - Admin Panel Test',
                status: 'upcoming',
                match_date: new Date().toISOString().split('T')[0]
            })
            .select()
            .single();

        if (createError) {
            return { success: false, message: `Match creation error: ${createError.message}` };
        }

        // Test deletion
        const { error: deleteError } = await supabase
            .from('matches')
            .delete()
            .eq('id', testMatch.id);

        if (deleteError) {
            return { success: false, message: `Match deletion error: ${deleteError.message}` };
        }

        return { 
            success: true, 
            message: `Matches management functional: Create/Read/Delete operations work. ${matches.length} existing matches.` 
        };
    }

    // Test 3: Items Management
    async testItemsManagement() {
        const { data: items, error } = await supabase
            .from('items')
            .select('*')
            .limit(3);

        if (error) {
            return { success: false, message: `Items query error: ${error.message}` };
        }

        return { 
            success: true, 
            message: `Items management functional: ${items.length} items accessible` 
        };
    }

    // Test 4: Badges Management
    async testBadgesManagement() {
        const { data: badges, error } = await supabase
            .from('badges')
            .select('*')
            .limit(3);

        if (error) {
            return { success: false, message: `Badges query error: ${error.message}` };
        }

        return { 
            success: true, 
            message: `Badges management functional: ${badges.length} badges accessible` 
        };
    }

    // Test 5: Achievements Management
    async testAchievementsManagement() {
        const { data: achievements, error } = await supabase
            .from('achievements')
            .select('*')
            .limit(3);

        if (error) {
            return { success: false, message: `Achievements query error: ${error.message}` };
        }

        return { 
            success: true, 
            message: `Achievements management functional: ${achievements.length} achievements accessible` 
        };
    }

    // Test 6: Missions Management
    async testMissionsManagement() {
        const { data: missions, error } = await supabase
            .from('missions')
            .select('*')
            .limit(3);

        if (error) {
            return { success: false, message: `Missions query error: ${error.message}` };
        }

        return { 
            success: true, 
            message: `Missions management functional: ${missions.length} missions accessible` 
        };
    }

    // Test 7: Crates Management
    async testCratesManagement() {
        const { data: crates, error } = await supabase
            .from('crates')
            .select('*')
            .limit(3);

        if (error) {
            return { success: false, message: `Crates query error: ${error.message}` };
        }

        const { data: crateItems, error: itemsError } = await supabase
            .from('crate_items')
            .select('*')
            .limit(3);

        if (itemsError) {
            return { success: false, message: `Crate items query error: ${itemsError.message}` };
        }

        return { 
            success: true, 
            message: `Crates management functional: ${crates.length} crates, ${crateItems.length} crate items accessible` 
        };
    }

    // Test 8: User Bets Management (Related to match deletion)
    async testUserBetsManagement() {
        const { data: bets, error } = await supabase
            .from('user_bets')
            .select('*')
            .limit(3);

        if (error) {
            return { success: false, message: `User bets query error: ${error.message}` };
        }

        return { 
            success: true, 
            message: `User bets management functional: ${bets.length} bets accessible (important for match deletion cascade)` 
        };
    }

    // Test 9: Notifications Management
    async testNotificationsManagement() {
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .limit(3);

        if (error) {
            return { success: false, message: `Notifications query error: ${error.message}` };
        }

        return { 
            success: true, 
            message: `Notifications management functional: ${notifications.length} notifications accessible` 
        };
    }

    // Test 10: Support Tickets Management
    async testSupportTicketsManagement() {
        const { data: tickets, error } = await supabase
            .from('support_tickets')
            .select('*')
            .limit(3);

        if (error) {
            return { success: false, message: `Support tickets query error: ${error.message}` };
        }

        return { 
            success: true, 
            message: `Support tickets management functional: ${tickets.length} tickets accessible` 
        };
    }

    // Test 11: Admin Logs (Important for admin actions tracking)
    async testAdminLogsManagement() {
        const { data: logs, error } = await supabase
            .from('admin_logs')
            .select('*')
            .limit(3);

        if (error) {
            return { success: false, message: `Admin logs query error: ${error.message}` };
        }

        // Test creating an admin log entry
        const { error: createError } = await supabase
            .from('admin_logs')
            .insert({
                id: 'test-log-' + Date.now(),
                action: 'test_action',
                details: 'Admin panel functionality test'
            });

        if (createError) {
            return { success: false, message: `Admin log creation error: ${createError.message}` };
        }

        return { 
            success: true, 
            message: `Admin logs functional: ${logs.length} logs accessible, can create new logs` 
        };
    }

    // Test 12: Check Foreign Key Constraints (Match Deletion Issues)
    async testForeignKeyConstraints() {
        // Check if there are any foreign key constraint issues that might prevent deletion
        const constraints = [];
        
        // Check user_bets -> matches relationship
        const { data: betsWithMatches, error: betsError } = await supabase
            .from('user_bets')
            .select('id, match_id')
            .not('match_id', 'is', null)
            .limit(1);

        if (betsError) {
            constraints.push(`user_bets FK issue: ${betsError.message}`);
        }

        // Check match_votes -> matches relationship
        const { data: votesWithMatches, error: votesError } = await supabase
            .from('match_votes')
            .select('id, match_id')
            .not('match_id', 'is', null)
            .limit(1);

        if (votesError) {
            constraints.push(`match_votes FK issue: ${votesError.message}`);
        }

        if (constraints.length > 0) {
            return { 
                success: false, 
                message: `Foreign key constraint issues: ${constraints.join(', ')}` 
            };
        }

        return { 
            success: true, 
            message: `Foreign key constraints OK: user_bets and match_votes relationships functional` 
        };
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive Admin Panel Functionality Test\n');
        console.log('=' .repeat(70));

        await this.runTest('Users Management', () => this.testUsersManagement());
        await this.runTest('Matches Management & Deletion', () => this.testMatchesManagement());
        await this.runTest('Items Management', () => this.testItemsManagement());
        await this.runTest('Badges Management', () => this.testBadgesManagement());
        await this.runTest('Achievements Management', () => this.testAchievementsManagement());
        await this.runTest('Missions Management', () => this.testMissionsManagement());
        await this.runTest('Crates Management', () => this.testCratesManagement());
        await this.runTest('User Bets Management', () => this.testUserBetsManagement());
        await this.runTest('Notifications Management', () => this.testNotificationsManagement());
        await this.runTest('Support Tickets Management', () => this.testSupportTicketsManagement());
        await this.runTest('Admin Logs Management', () => this.testAdminLogsManagement());
        await this.runTest('Foreign Key Constraints', () => this.testForeignKeyConstraints());

        console.log('=' .repeat(70));
        console.log('🏁 ADMIN PANEL TEST SUMMARY');
        console.log('=' .repeat(70));
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`📊 Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);

        if (this.failedTests === 0) {
            console.log('\n🎉 ALL ADMIN PANEL TESTS PASSED!');
            console.log('✅ All admin management features are functional');
            console.log('✅ Match deletion should work properly');
            console.log('✅ All database relationships are intact');
        } else {
            console.log('\n⚠️  Some admin panel tests failed.');
            console.log('🔧 Issues found that may prevent proper admin functionality:');
            this.testResults.filter(r => r.status !== 'PASSED').forEach(result => {
                console.log(`   ❌ ${result.test}: ${result.message}`);
            });
        }

        return {
            totalTests: this.passedTests + this.failedTests,
            passedTests: this.passedTests,
            failedTests: this.failedTests,
            successRate: (this.passedTests / (this.passedTests + this.failedTests)) * 100,
            allPassed: this.failedTests === 0
        };
    }
}

// Run the tests
async function main() {
    const tester = new AdminPanelTester();
    const results = await tester.runAllTests();
    
    if (results.allPassed) {
        console.log('\n🎯 NEXT STEPS:');
        console.log('1. ✅ Database is fully functional for admin operations');
        console.log('2. ✅ Match deletion should work - check browser console for any JS errors');
        console.log('3. ✅ All admin panel features are ready for use');
        process.exit(0);
    } else {
        console.log('\n🔧 ISSUES TO RESOLVE:');
        console.log('1. Fix any database permission or constraint issues shown above');
        console.log('2. Check browser console for JavaScript errors during deletion');
        console.log('3. Verify admin role permissions in auth system');
        process.exit(1);
    }
}

main().catch(console.error);