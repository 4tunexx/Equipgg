import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get all user rewards
    const { data, error } = await supabase
      .from('user_rewards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json([]);
      }
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching user rewards:', error);
    return NextResponse.json({ error: "Unable to fetch user rewards" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const reward = await request.json();
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('user_rewards')
      .insert([{
        name: reward.name,
        description: reward.description,
        type: reward.type,
        trigger_condition: reward.trigger_condition,
        reward_coins: reward.reward_coins,
        reward_xp: reward.reward_xp,
        reward_gems: reward.reward_gems,
        reward_item: reward.reward_item,
        is_active: reward.is_active,
        max_claims_per_user: reward.max_claims_per_user,
        cooldown_hours: reward.cooldown_hours
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating user reward:', error);
    return NextResponse.json({ error: "Unable to create user reward" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('user_rewards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating user reward:', error);
    return NextResponse.json({ error: "Unable to update user reward" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Reward ID required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from('user_rewards')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user reward:', error);
    return NextResponse.json({ error: "Unable to delete user reward" }, { status: 500 });
  }
}