#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQLFile(filePath) {
  try {
    console.log(`📄 Reading SQL file: ${filePath}`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split by semicolons and filter out empty statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔄 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ Failed to read or execute ${filePath}:`, error.message);
  }
}

async function populateDatabase() {
  console.log('🚀 Starting database population...');
  
  const sqlFiles = [
    'database-population-part1.sql',
    'database-population-part2.sql', 
    'database-population-part3.sql'
  ];

  for (const sqlFile of sqlFiles) {
    const filePath = path.join(__dirname, sqlFile);
    
    if (fs.existsSync(filePath)) {
      await runSQLFile(filePath);
      console.log(`✅ Completed: ${sqlFile}\n`);
    } else {
      console.error(`❌ File not found: ${filePath}`);
    }
  }

  // Verify the data was inserted
  console.log('🔍 Verifying data insertion...');
  
  try {
    const { data: achievements, error: achError } = await supabase
      .from('achievements')
      .select('count(*)', { count: 'exact' });
    
    const { data: items, error: itemError } = await supabase
      .from('items')
      .select('count(*)', { count: 'exact' });
    
    const { data: missions, error: missionError } = await supabase
      .from('missions')
      .select('count(*)', { count: 'exact' });
    
    const { data: perks, error: perkError } = await supabase
      .from('perks')
      .select('count(*)', { count: 'exact' });

    console.log('\n📊 Database Population Summary:');
    console.log(`- Achievements: ${achievements?.[0]?.count || 0}`);
    console.log(`- Items: ${items?.[0]?.count || 0}`);
    console.log(`- Missions: ${missions?.[0]?.count || 0}`);
    console.log(`- Perks: ${perks?.[0]?.count || 0}`);
    
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  }

  console.log('\n🎉 Database population completed!');
  console.log('🔗 Access the admin panel at: /dashboard/admin/game-data');
}

// Run the population
populateDatabase().catch(console.error);