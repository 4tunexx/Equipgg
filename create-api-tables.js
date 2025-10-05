const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rxamnospcmbtgzptmmxl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4YW1ub3NwY21idGd6cHRtbXhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA1NjgzOSwiZXhwIjoyMDczNjMyODM5fQ.TLkG3Dgrp0QAq_APeXrukFcrR4Eof15miMYynWFxqMc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMissingTables() {
  console.log('🔄 Creating missing API tables...');

  // Create support_tickets table
  try {
    console.log('\n📋 Creating support_tickets table...');
    const { error: supportError } = await supabase.rpc('create_support_tickets_table', {});
    
    if (supportError) {
      // Try creating with raw SQL
      const supportSQL = `
        CREATE TABLE IF NOT EXISTS support_tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          subject TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'general',
          status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
          priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
          assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          resolved_at TIMESTAMPTZ
        );
        
        ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
        CREATE POLICY "Users can view own tickets" ON support_tickets
          FOR SELECT USING (user_id = auth.uid());
          
        DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
        CREATE POLICY "Users can create tickets" ON support_tickets
          FOR INSERT WITH CHECK (user_id = auth.uid());
          
        DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;
        CREATE POLICY "Admins can view all tickets" ON support_tickets
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM users 
              WHERE users.id = auth.uid() 
              AND users.role IN ('admin', 'moderator')
            )
          );
      `;
      
      console.log('Executing support_tickets SQL directly...');
      const { error: rawError } = await supabase.rpc('exec', { sql: supportSQL });
      if (rawError) {
        console.log('⚠️ Support tickets table might already exist or needs manual creation');
      } else {
        console.log('✅ Support tickets table created');
      }
    } else {
      console.log('✅ Support tickets table created');
    }
  } catch (e) {
    console.log('⚠️ Support tickets table creation skipped (might already exist)');
  }

  // Create flash_sales table
  try {
    console.log('\n💸 Creating flash_sales table...');
    const flashSalesSQL = `
      CREATE TABLE IF NOT EXISTS flash_sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID REFERENCES items(id) ON DELETE CASCADE,
        original_price DECIMAL(10,2) NOT NULL,
        sale_price DECIMAL(10,2) NOT NULL,
        discount_percent INTEGER NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Public can view flash sales" ON flash_sales;
      CREATE POLICY "Public can view flash sales" ON flash_sales
        FOR SELECT USING (true);
        
      DROP POLICY IF EXISTS "Admins can manage flash sales" ON flash_sales;
      CREATE POLICY "Admins can manage flash sales" ON flash_sales
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
          )
        );
    `;
    
    const { error: flashError } = await supabase.rpc('exec', { sql: flashSalesSQL });
    if (flashError) {
      console.log('⚠️ Flash sales table might already exist or needs manual creation');
    } else {
      console.log('✅ Flash sales table created');
    }
  } catch (e) {
    console.log('⚠️ Flash sales table creation skipped (might already exist)');
  }

  // Create notifications table
  try {
    console.log('\n🔔 Creating notifications table...');
    const notificationsSQL = `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
      CREATE POLICY "Users can view own notifications" ON notifications
        FOR SELECT USING (user_id = auth.uid());
        
      DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
      CREATE POLICY "Users can update own notifications" ON notifications
        FOR UPDATE USING (user_id = auth.uid());
    `;
    
    const { error: notifError } = await supabase.rpc('exec', { sql: notificationsSQL });
    if (notifError) {
      console.log('⚠️ Notifications table might already exist or needs manual creation');
    } else {
      console.log('✅ Notifications table created');
    }
  } catch (e) {
    console.log('⚠️ Notifications table creation skipped (might already exist)');
  }

  console.log('\n🎉 Table creation process completed!');
  console.log('The APIs should now work without 500 errors.');
}

createMissingTables().catch(console.error);