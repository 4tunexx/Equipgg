import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

// User API Keys Management
export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's API keys
    const { data: apiKeys, error } = await supabase
      .from('user_api_keys')
      .select('id, name, key_prefix, permissions, created_at, last_used, is_active')
      .eq('user_id', session.user_id)
      .order('created_at', { ascending: false });

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching API keys:', error);
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
    }

    // If table doesn't exist, return empty array
    if (error && error.code === 'PGRST116') {
      return NextResponse.json({
        success: true,
        apiKeys: [],
        message: 'API key management not yet available'
      });
    }

    // Hide the full API key, only show prefix
    const safeKeys = (apiKeys || []).map(key => ({
      ...key,
      keyDisplay: `${key.key_prefix}...`
    }));

    return NextResponse.json({
      success: true,
      apiKeys: safeKeys
    });

  } catch (error) {
    console.error('Error in API keys GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, permissions = ['read'] } = await request.json();

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ 
        error: 'API key name must be at least 3 characters long' 
      }, { status: 400 });
    }

    // Generate API key
    const apiKey = `equipgg_${generateRandomString(32)}`;
    const keyPrefix = apiKey.substring(0, 12);

    // Create API key record
    const { data: newKey, error } = await supabase
      .from('user_api_keys')
      .insert([{
        user_id: session.user_id,
        name: name.trim(),
        api_key: apiKey,
        key_prefix: keyPrefix,
        permissions: JSON.stringify(permissions),
        is_active: true,
        created_at: new Date().toISOString()
      }])
      .select('id, name, key_prefix, permissions, created_at, is_active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'API key management not yet available - database tables pending'
        }, { status: 503 });
      }
      console.error('Error creating API key:', error);
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'API key created successfully',
      apiKey: {
        ...newKey,
        fullKey: apiKey, // Only shown once during creation
        keyDisplay: `${keyPrefix}...`
      }
    });

  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json({ 
        error: 'API key ID is required' 
      }, { status: 400 });
    }

    // Delete the API key (only if it belongs to the user)
    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', session.user_id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'API key management not yet available'
        }, { status: 503 });
      }
      console.error('Error deleting API key:', error);
      return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate random string
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
