/*
  Run with:
    node scripts\check-supabase-tables.js
  Requires environment variables in the shell: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
  The script will attempt to query each expected table and print a JSON report to stdout.
*/

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const expectedTables = [
  'users',
  'items',
  'ranks',
  'badges',
  'achievements',
  'crates',
  'perks',
  'missions',
  'user_inventory',
  'user_achievements',
  'user_transactions',
  'notifications',
  'activity_feed',
  'site_settings',
  'shop',
  'shop_items',
  'chat_rooms',
  'chat_messages',
  'support_tickets',
  'support_replies',
  'user_perks'
];

(async () => {
  const results = {};

  for (const table of expectedTables) {
    try {
      // Try a head count first (fast)
      const { count, error: headError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (headError) {
        // Table might not exist or permissions issue
        results[table] = { exists: false, error: headError.message };
        continue;
      }

      // Try to fetch a sample row to get columns
      const { data: sample, error: sampleError } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (sampleError) {
        results[table] = { exists: true, count: count || 0, sample: [], error: sampleError.message };
      } else {
        const cols = Array.isArray(sample) && sample.length > 0 ? Object.keys(sample[0]) : [];
        results[table] = { exists: true, count: count || 0, sampleColumns: cols };
      }
    } catch (err) {
      results[table] = { exists: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
})();
