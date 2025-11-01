import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthSession } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    // Only allow admins
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const inspection: any = {
      timestamp: new Date().toISOString(),
      tables: {}
    };

    // 1. Check activity_feed table structure and sample data
    try {
      // Try to get column info by querying a row
      const { data: activitySample, error: activityError } = await supabase
        .from('activity_feed')
        .select('*')
        .limit(1)
        .maybeSingle();

      // Get count
      const { count: activityCount } = await supabase
        .from('activity_feed')
        .select('*', { count: 'exact', head: true });

      // Get sample rows
      const { data: activityRows } = await supabase
        .from('activity_feed')
        .select('*')
        .limit(5);

      // Check for Steam user IDs
      const { data: steamActivities } = await supabase
        .from('activity_feed')
        .select('user_id, action, created_at')
        .like('user_id', 'steam-%')
        .limit(5);

      inspection.tables.activity_feed = {
        exists: !activityError,
        error: activityError?.message || null,
        sampleRow: activitySample ? Object.keys(activitySample) : null,
        sampleData: activitySample,
        totalCount: activityCount || 0,
        sampleRows: activityRows || [],
        steamUserActivities: steamActivities || [],
        user_id_type_detected: activitySample?.user_id ? typeof activitySample.user_id : null,
        user_id_sample: activitySample?.user_id || null
      };
    } catch (error: any) {
      inspection.tables.activity_feed = {
        exists: false,
        error: error.message
      };
    }

    // 2. Check user_mission_progress table structure
    try {
      const { data: progressSample } = await supabase
        .from('user_mission_progress')
        .select('*')
        .limit(1)
        .maybeSingle();

      const { count: progressCount } = await supabase
        .from('user_mission_progress')
        .select('*', { count: 'exact', head: true });

      // Check for Steam user IDs
      const { data: steamProgress } = await supabase
        .from('user_mission_progress')
        .select('user_id, mission_id, progress, completed')
        .like('user_id', 'steam-%')
        .limit(5);

      inspection.tables.user_mission_progress = {
        exists: true,
        sampleRow: progressSample ? Object.keys(progressSample) : null,
        sampleData: progressSample,
        totalCount: progressCount || 0,
        steamUserProgress: steamProgress || [],
        columns_detected: progressSample ? Object.keys(progressSample) : []
      };
    } catch (error: any) {
      inspection.tables.user_mission_progress = {
        exists: false,
        error: error.message
      };
    }

    // 3. Check users table structure
    try {
      const { data: userSample } = await supabase
        .from('users')
        .select('id, email, username, provider, steam_id, role')
        .limit(1)
        .maybeSingle();

      // Get Steam users
      const { data: steamUsers } = await supabase
        .from('users')
        .select('id, email, username, provider, steam_id, steam_verified')
        .or('provider.eq.steam,id.like.steam-%')
        .limit(5);

      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      inspection.tables.users = {
        exists: true,
        sampleRow: userSample ? Object.keys(userSample) : null,
        sampleData: userSample,
        totalCount: userCount || 0,
        steamUsers: steamUsers || [],
        id_type_detected: userSample?.id ? typeof userSample.id : null,
        id_sample: userSample?.id || null
      };
    } catch (error: any) {
      inspection.tables.users = {
        exists: false,
        error: error.message
      };
    }

    // 4. Get actual table schema by querying sample data and checking column types
    inspection.schema_summary = {
      activity_feed: {
        columns_from_sample: inspection.tables.activity_feed?.sampleRow || [],
        user_id_type: inspection.tables.activity_feed?.user_id_type_detected || 'unknown',
        user_id_sample: inspection.tables.activity_feed?.user_id_sample || null,
        has_description: inspection.tables.activity_feed?.sampleRow?.includes('description') || false,
        has_metadata: inspection.tables.activity_feed?.sampleRow?.includes('metadata') || false
      },
      user_mission_progress: {
        columns_from_sample: inspection.tables.user_mission_progress?.columns_detected || [],
        has_started_at: inspection.tables.user_mission_progress?.columns_detected?.includes('started_at') || false,
        has_updated_at: inspection.tables.user_mission_progress?.columns_detected?.includes('updated_at') || false,
        has_created_at: inspection.tables.user_mission_progress?.columns_detected?.includes('created_at') || false,
        has_id: inspection.tables.user_mission_progress?.columns_detected?.includes('id') || false
      },
      users: {
        columns_from_sample: inspection.tables.users?.sampleRow || [],
        id_type: inspection.tables.users?.id_type_detected || 'unknown',
        id_sample: inspection.tables.users?.id_sample || null,
        steam_users_count: inspection.tables.users?.steamUsers?.length || 0
      }
    }

    // 5. Check for crate openings in activity_feed
    try {
      const { data: crateActivities } = await supabase
        .from('activity_feed')
        .select('id, user_id, action, item_id, created_at')
        .eq('action', 'opened_crate')
        .order('created_at', { ascending: false })
        .limit(10);

      inspection.crate_openings = {
        count: crateActivities?.length || 0,
        activities: crateActivities || []
      };
    } catch (error: any) {
      inspection.crate_openings = {
        error: error.message
      };
    }

    // 6. Check recent activities
    try {
      const { data: recentActivities } = await supabase
        .from('activity_feed')
        .select('id, user_id, action, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      inspection.recent_activities = {
        count: recentActivities?.length || 0,
        activities: recentActivities || []
      };
    } catch (error: any) {
      inspection.recent_activities = {
        error: error.message
      };
    }

    // 7. Try to get actual PostgreSQL schema using SQL query
    try {
      // Use Supabase REST API to query information_schema via SQL
      // This requires enabling pg_catalog queries or using a function
      // For now, we'll try a direct query to pg_catalog if RLS allows
      
      const schemaQuery = `
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN ('activity_feed', 'user_mission_progress', 'users')
        ORDER BY table_name, ordinal_position;
      `;

      // Try to execute via Supabase PostgREST if possible
      // If not, we'll use the sample data inference from above
      inspection.schema_query_attempted = true;
      inspection.schema_query_note = 'Direct SQL queries require Supabase SQL Editor or RPC function';
      
      // Also check what columns are actually returned in queries
      inspection.column_analysis = {
        activity_feed_columns_from_select_all: inspection.tables.activity_feed?.sampleRow || [],
        user_mission_progress_columns_from_select_all: inspection.tables.user_mission_progress?.columns_detected || [],
        users_columns_from_select_all: inspection.tables.users?.sampleRow || []
      };
      
    } catch (error: any) {
      inspection.schema_query_error = error.message;
    }

    // 8. Test query for Steam user activities
    try {
      // Try querying activity_feed with a Steam user ID to see the error
      const testSteamId = 'steam-76561198001993310';
      const { data: testData, error: testError } = await supabase
        .from('activity_feed')
        .select('*')
        .eq('user_id', testSteamId)
        .limit(1)
        .maybeSingle();
      
      inspection.steam_user_query_test = {
        steam_id_used: testSteamId,
        success: !testError,
        error: testError ? {
          code: testError.code,
          message: testError.message,
          details: testError.details,
          hint: testError.hint
        } : null,
        data_returned: testData ? 'yes' : 'no',
        sample_data: testData || null
      };
    } catch (error: any) {
      inspection.steam_user_query_test = {
        error: error.message
      };
    }

    // 9. Check missions table structure
    try {
      const { data: missionSample } = await supabase
        .from('missions')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      const { count: missionCount } = await supabase
        .from('missions')
        .select('*', { count: 'exact', head: true });
      
      const { data: dailyMissions } = await supabase
        .from('missions')
        .select('id, name, mission_type, requirement_type, requirement_value')
        .eq('mission_type', 'daily')
        .eq('is_active', true)
        .limit(10);
      
      const { data: mainMissions } = await supabase
        .from('missions')
        .select('id, name, mission_type')
        .eq('mission_type', 'main')
        .eq('is_active', true)
        .limit(10);

      inspection.tables.missions = {
        exists: true,
        sampleRow: missionSample ? Object.keys(missionSample) : null,
        sampleData: missionSample,
        totalCount: missionCount || 0,
        dailyMissions: dailyMissions || [],
        mainMissions: mainMissions || []
      };
    } catch (error: any) {
      inspection.tables.missions = {
        exists: false,
        error: error.message
      };
    }

    return NextResponse.json({
      success: true,
      inspection
    }, { status: 200 });

  } catch (error: any) {
    console.error('Inspection error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

