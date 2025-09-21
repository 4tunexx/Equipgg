import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

// VIP Tiers Configuration
const VIP_TIERS = {
  bronze: { name: 'Bronze VIP', cost: 1000, perks: ['5% bonus coins', '24/7 support', 'Bronze badge'] },
  silver: { name: 'Silver VIP', cost: 2500, perks: ['10% bonus coins', 'Priority support', 'Silver badge', 'Monthly bonus'] },
  gold: { name: 'Gold VIP', cost: 5000, perks: ['15% bonus coins', 'VIP support', 'Gold badge', 'Weekly bonus', 'Exclusive games'] },
  platinum: { name: 'Platinum VIP', cost: 10000, perks: ['20% bonus coins', 'Personal manager', 'Platinum badge', 'Daily bonus', 'All exclusive features'] }
};

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current VIP status
    const { data: userData, error } = await supabase
      .from('users')
      .select('vip_tier, vip_expires_at, coins')
      .eq('id', session.user_id)
      .single();

    if (error) {
      console.error('Error fetching user VIP status:', error);
      return NextResponse.json({ error: 'Failed to fetch VIP status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      currentTier: userData.vip_tier || 'none',
      expiresAt: userData.vip_expires_at,
      coins: userData.coins || 0,
      availableTiers: VIP_TIERS
    });

  } catch (error) {
    console.error('Error in VIP status API:', error);
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

    const { tier, duration = 30 } = await request.json(); // duration in days

    if (!tier || !VIP_TIERS[tier as keyof typeof VIP_TIERS]) {
      return NextResponse.json({ 
        error: 'Invalid VIP tier. Available tiers: bronze, silver, gold, platinum' 
      }, { status: 400 });
    }

    const tierData = VIP_TIERS[tier as keyof typeof VIP_TIERS];
    const totalCost = tierData.cost * (duration / 30); // Pro-rate for duration

    // Get user's current balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('coins, vip_tier, vip_expires_at')
      .eq('id', session.user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userData.coins < totalCost) {
      return NextResponse.json({ 
        error: 'Insufficient coins',
        required: totalCost,
        current: userData.coins
      }, { status: 400 });
    }

    // Calculate new expiration date
    const currentExpiry = userData.vip_expires_at ? new Date(userData.vip_expires_at) : new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(baseDate.getTime() + (duration * 24 * 60 * 60 * 1000));

    // Update user's VIP status and deduct coins
    const { error: updateError } = await supabase
      .from('users')
      .update({
        vip_tier: tier,
        vip_expires_at: newExpiry.toISOString(),
        coins: userData.coins - totalCost
      })
      .eq('id', session.user_id);

    if (updateError) {
      console.error('Error upgrading VIP:', updateError);
      return NextResponse.json({ error: 'Failed to upgrade VIP' }, { status: 500 });
    }

    // Record the transaction
    await supabase.from('user_transactions').insert([{
      user_id: session.user_id,
      type: 'vip_upgrade',
      amount: -totalCost,
      description: `Upgraded to ${tierData.name} for ${duration} days`,
      created_at: new Date().toISOString()
    }]);

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${tierData.name}`,
      newTier: tier,
      expiresAt: newExpiry.toISOString(),
      coinsSpent: totalCost,
      remainingCoins: userData.coins - totalCost,
      perks: tierData.perks
    });

  } catch (error) {
    console.error('Error in VIP upgrade API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
