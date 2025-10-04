import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

// User Crate Keys Management
export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's crate keys
    const { data: userKeys, error } = await supabase
      .from('user_keys')
      .select('crate_id, keys_count')
      .eq('user_id', session.user_id);

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching crate keys:', error);
      return NextResponse.json({ error: 'Failed to fetch crate keys' }, { status: 500 });
    }

    // If table doesn't exist, return mock data for development
    if (error && error.code === 'PGRST116') {
      console.log('user_keys table not found, returning mock keys');
      return NextResponse.json({
        success: true,
        keys: {
          '1': 2, // Starter Crate
          '2': 1, // Bronze Crate  
          '3': 0, // Silver Crate
          '4': 0, // Gold Crate
          '5': 0  // Platinum Crate
        },
        message: 'Using mock data - user_keys table not yet available'
      });
    }

    // Transform array to object with crate_id as key
    const keysObject = (userKeys || []).reduce((acc, key) => {
      acc[key.crate_id] = key.keys_count || 0;
      return acc;
    }, {} as Record<string, number>);

    // Ensure all 5 crates have entries (default to 0)
    const allKeys = {
      '1': keysObject['1'] || 0,
      '2': keysObject['2'] || 0, 
      '3': keysObject['3'] || 0,
      '4': keysObject['4'] || 0,
      '5': keysObject['5'] || 0,
      'level-up': keysObject['level-up'] || 0
    };

    return NextResponse.json({
      success: true,
      keys: allKeys
    });

  } catch (error) {
    console.error('Error in crate keys GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add crate keys (admin or system use)
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { crateId, quantity = 1, reason = 'Manual addition' } = await request.json();

    if (!crateId) {
      return NextResponse.json({ 
        error: 'Crate ID is required' 
      }, { status: 400 });
    }

    // Check if user already has keys for this crate
    const { data: existingKey, error: fetchError } = await supabase
      .from('user_keys')
      .select('keys_count')
      .eq('user_id', session.user_id)
      .eq('crate_id', crateId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing keys:', fetchError);
      return NextResponse.json({ error: 'Failed to check existing keys' }, { status: 500 });
    }

    // Handle table not existing
    if (fetchError && fetchError.code === 'PGRST116') {
      return NextResponse.json({
        success: true,
        message: 'Keys would be added (user_keys table not yet available)',
        keys: { [crateId]: quantity }
      });
    }

    if (existingKey) {
      // Update existing key count
      const { error: updateError } = await supabase
        .from('user_keys')
        .update({ 
          keys_count: existingKey.keys_count + quantity,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user_id)
        .eq('crate_id', crateId);

      if (updateError) {
        console.error('Error updating key count:', updateError);
        return NextResponse.json({ error: 'Failed to update keys' }, { status: 500 });
      }
    } else {
      // Create new key record
      const { error: insertError } = await supabase
        .from('user_keys')
        .insert([{
          id: `${session.user_id}-${crateId}`,
          user_id: session.user_id,
          crate_id: crateId,
          keys_count: quantity,
          acquired_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Error creating new key record:', insertError);
        return NextResponse.json({ error: 'Failed to create keys' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Added ${quantity} key(s) for crate ${crateId}`,
      reason
    });

  } catch (error) {
    console.error('Error in crate keys POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Use a crate key (consume one key)
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { crateId } = await request.json();

    if (!crateId) {
      return NextResponse.json({ 
        error: 'Crate ID is required' 
      }, { status: 400 });
    }

    // Get current key count
    const { data: existingKey, error: fetchError } = await supabase
      .from('user_keys')
      .select('keys_count')
      .eq('user_id', session.user_id)
      .eq('crate_id', crateId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Key system not available - user_keys table missing'
        }, { status: 503 });
      }
      return NextResponse.json({ 
        error: 'No keys found for this crate' 
      }, { status: 404 });
    }

    if (!existingKey || existingKey.keys_count <= 0) {
      return NextResponse.json({ 
        error: 'No keys available for this crate' 
      }, { status: 400 });
    }

    // Consume one key
    const { error: updateError } = await supabase
      .from('user_keys')
      .update({ 
        keys_count: existingKey.keys_count - 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.user_id)
      .eq('crate_id', crateId);

    if (updateError) {
      console.error('Error consuming key:', updateError);
      return NextResponse.json({ error: 'Failed to use key' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Key consumed successfully',
      remainingKeys: existingKey.keys_count - 1
    });

  } catch (error) {
    console.error('Error in crate keys PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}