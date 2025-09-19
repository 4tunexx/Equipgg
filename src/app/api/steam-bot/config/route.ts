import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../../lib/auth-utils";
import { supabase } from "../../../../lib/supabase";

// Steam Bot Configuration API
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get Steam bot configuration
    const { data: botConfig } = await supabase
      .from('steam_bot_config')
      .select('*')
      .eq('id', 1)
      .single();

    return NextResponse.json({
      success: true,
      config: botConfig || {
        id: 1,
        bot_enabled: false,
        steam_username: '',
        steam_password: '',
        steam_api_key: '',
        steam_id: '',
        trade_offer_url: '',
        inventory_sync_interval: 300, // 5 minutes
        auto_accept_trades: false,
        max_trade_value: 1000,
        status: 'offline',
        last_sync: null
      }
    });

  } catch (error) {
    console.error('Steam bot config error:', error);
    return NextResponse.json({ error: 'Failed to get bot config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const {
      bot_enabled,
      steam_username,
      steam_password,
      steam_api_key,
      steam_id,
      trade_offer_url,
      inventory_sync_interval,
      auto_accept_trades,
      max_trade_value
    } = await request.json();

    // Update Steam bot configuration
    const { data: config, error } = await supabase
      .from('steam_bot_config')
      .upsert({
        id: 1,
        bot_enabled,
        steam_username,
        steam_password,
        steam_api_key,
        steam_id,
        trade_offer_url,
        inventory_sync_interval,
        auto_accept_trades,
        max_trade_value,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Steam bot config update error:', error);
      return NextResponse.json({ error: 'Failed to update bot config' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Steam bot configuration updated successfully',
      config
    });

  } catch (error) {
    console.error('Steam bot config update error:', error);
    return NextResponse.json({ error: 'Failed to update bot config' }, { status: 500 });
  }
}