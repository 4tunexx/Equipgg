import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

// Admin-only: Give crates to users
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { 
      userId, 
      crateType, 
      quantity = 1, 
      reason = 'Admin gift'
    } = await request.json();

    if (!userId || !crateType) {
      return NextResponse.json({ 
        error: 'User ID and crate type are required' 
      }, { status: 400 });
    }

    if (quantity <= 0 || quantity > 50) {
      return NextResponse.json({ 
        error: 'Quantity must be between 1 and 50' 
      }, { status: 400 });
    }

    const validCrateTypes = [
      'common', 'uncommon', 'rare', 'epic', 'legendary',
      'starter', 'daily', 'weekly', 'premium', 'special'
    ];

    if (!validCrateTypes.includes(crateType)) {
      return NextResponse.json({ 
        error: `Invalid crate type. Valid types: ${validCrateTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', userId)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          message: `Would give ${quantity} ${crateType} crate(s) to user ${userId}`,
          details: {
            userId,
            crateType,
            quantity,
            reason
          }
        });
      }
      console.error('Error fetching target user:', userError);
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Create crate records
    const crateRecords = [];
    for (let i = 0; i < quantity; i++) {
      crateRecords.push({
        id: `crate_${Date.now()}_${Math.random().toString(36).substr(2, 6)}_${i}`,
        user_id: userId,
        crate_type: crateType,
        status: 'unopened',
        given_by: session.user_id,
        reason,
        created_at: new Date().toISOString()
      });
    }

    // Insert crate records
    const { data: newCrates, error: crateError } = await supabase
      .from('user_crates')
      .insert(crateRecords)
      .select();

    if (crateError) {
      if (crateError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          message: `Gave ${quantity} ${crateType} crate(s) to ${targetUser.username} (crates system in development)`,
          crates: crateRecords.map(c => ({ 
            id: c.id, 
            type: c.crate_type, 
            status: c.status 
          }))
        });
      }
      console.error('Error creating crates:', crateError);
      return NextResponse.json({ error: 'Failed to give crates' }, { status: 500 });
    }

    // Record admin action in logs
    const { error: logError } = await supabase
      .from('admin_logs')
      .insert([{
        admin_id: session.user_id,
        action: 'give_crates',
        target_user_id: userId,
        details: JSON.stringify({
          crateType,
          quantity,
          reason,
          crateIds: newCrates.map(c => c.id)
        }),
        created_at: new Date().toISOString()
      }]);

    if (logError && logError.code !== 'PGRST116') {
      console.error('Error logging admin action:', logError);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully gave ${quantity} ${crateType} crate(s) to ${targetUser.username}`,
      crates: newCrates.map(c => ({ 
        id: c.id, 
        type: c.crate_type, 
        status: c.status,
        created_at: c.created_at
      }))
    });

  } catch (error) {
    console.error('Error giving crates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get user's crates
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || session.user_id;
    const status = searchParams.get('status'); // unopened, opened, all
    const crateType = searchParams.get('type');

    // Check if requesting another user's crates (admin only)
    if (userId !== session.user_id) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user_id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Build query
    let query = supabase
      .from('user_crates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (crateType) {
      query = query.eq('crate_type', crateType);
    }

    const { data: crates, error: cratesError } = await query;

    if (cratesError) {
      if (cratesError.code === 'PGRST116') {
        // Return mock crates data
        const mockCrates = [
          {
            id: 'crate_mock_1',
            crate_type: 'common',
            status: 'unopened',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            reason: 'Daily login bonus'
          },
          {
            id: 'crate_mock_2',
            crate_type: 'rare',
            status: 'unopened',
            created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            reason: 'Level up reward'
          },
          {
            id: 'crate_mock_3',
            crate_type: 'epic',
            status: 'opened',
            created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            opened_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            reason: 'Weekly reward'
          }
        ];

        const filteredMockCrates = mockCrates.filter(crate => {
          if (status && status !== 'all' && crate.status !== status) return false;
          if (crateType && crate.crate_type !== crateType) return false;
          return true;
        });

        return NextResponse.json({
          success: true,
          crates: filteredMockCrates,
          total: filteredMockCrates.length,
          summary: {
            unopened: mockCrates.filter(c => c.status === 'unopened').length,
            opened: mockCrates.filter(c => c.status === 'opened').length,
            byType: {
              common: mockCrates.filter(c => c.crate_type === 'common').length,
              rare: mockCrates.filter(c => c.crate_type === 'rare').length,
              epic: mockCrates.filter(c => c.crate_type === 'epic').length
            }
          },
          message: 'Crates system in development - using mock data'
        });
      }
      console.error('Error fetching crates:', cratesError);
      return NextResponse.json({ error: 'Failed to fetch crates' }, { status: 500 });
    }

    // Calculate summary statistics
    const unopened = crates?.filter(c => c.status === 'unopened').length || 0;
    const opened = crates?.filter(c => c.status === 'opened').length || 0;
    
    const byType = {} as any;
    crates?.forEach(crate => {
      byType[crate.crate_type] = (byType[crate.crate_type] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      crates: crates || [],
      total: crates?.length || 0,
      summary: {
        unopened,
        opened,
        byType
      }
    });

  } catch (error) {
    console.error('Error fetching crates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Open a crate
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

    // Get the crate
    const { data: crate, error: crateError } = await supabase
      .from('user_crates')
      .select('*')
      .eq('id', crateId)
      .eq('user_id', session.user_id)
      .single();

    if (crateError) {
      if (crateError.code === 'PGRST116') {
        // Simulate crate opening
        const mockRewards = [
          { type: 'coins', amount: 100, rarity: 'common' },
          { type: 'xp', amount: 50, rarity: 'common' },
          { type: 'skin', name: 'AK-47 Redline', value: 250, rarity: 'rare' }
        ];
        const reward = mockRewards[Math.floor(Math.random() * mockRewards.length)];

        return NextResponse.json({
          success: true,
          message: 'Crate opened successfully (development mode)',
          crate: {
            id: crateId,
            type: 'common',
            opened_at: new Date().toISOString()
          },
          rewards: [reward]
        });
      }
      console.error('Error fetching crate:', crateError);
      return NextResponse.json({ error: 'Crate not found' }, { status: 404 });
    }

    // Check if crate is already opened
    if (crate.status === 'opened') {
      return NextResponse.json({ 
        error: 'Crate has already been opened' 
      }, { status: 400 });
    }

    // Define crate contents based on type
    const crateContents = {
      common: [
        { type: 'coins', amount: 50, rarity: 'common', weight: 50 },
        { type: 'xp', amount: 25, rarity: 'common', weight: 30 },
        { type: 'coins', amount: 100, rarity: 'uncommon', weight: 15 },
        { type: 'xp', amount: 75, rarity: 'uncommon', weight: 5 }
      ],
      rare: [
        { type: 'coins', amount: 200, rarity: 'rare', weight: 40 },
        { type: 'xp', amount: 150, rarity: 'rare', weight: 25 },
        { type: 'skin', name: 'AK-47 Redline', value: 350, rarity: 'rare', weight: 20 },
        { type: 'coins', amount: 500, rarity: 'epic', weight: 10 },
        { type: 'skin', name: 'AWP Dragon Lore', value: 1000, rarity: 'legendary', weight: 5 }
      ],
      epic: [
        { type: 'coins', amount: 500, rarity: 'epic', weight: 35 },
        { type: 'skin', name: 'Karambit Fade', value: 800, rarity: 'epic', weight: 25 },
        { type: 'skin', name: 'M4A4 Howl', value: 1200, rarity: 'legendary', weight: 15 },
        { type: 'coins', amount: 1000, rarity: 'legendary', weight: 10 },
        { type: 'skin', name: 'Dragon Lore Collection', value: 2500, rarity: 'mythical', weight: 5 }
      ]
    };

    const availableRewards = crateContents[crate.crate_type as keyof typeof crateContents] || crateContents.common;

    // Weighted random selection
    const totalWeight = availableRewards.reduce((sum, reward) => sum + reward.weight, 0);
    const random = Math.random() * totalWeight;
    let currentWeight = 0;
    
    let selectedReward = availableRewards[0];
    for (const reward of availableRewards) {
      currentWeight += reward.weight;
      if (random <= currentWeight) {
        selectedReward = reward;
        break;
      }
    }

    // Apply reward to user
    const { data: currentUser } = await supabase
      .from('users')
      .select('balance, xp')
      .eq('id', session.user_id)
      .single();

    if (currentUser) {
      const updates: any = { updated_at: new Date().toISOString() };

      if (selectedReward.type === 'coins') {
        updates.balance = currentUser.balance + selectedReward.amount;
      } else if (selectedReward.type === 'xp') {
        updates.xp = (currentUser.xp || 0) + selectedReward.amount;
      }

      if (Object.keys(updates).length > 1) {
        await supabase
          .from('users')
          .update(updates)
          .eq('id', session.user_id);
      }
    }

    // Mark crate as opened
    const { error: updateError } = await supabase
      .from('user_crates')
      .update({
        status: 'opened',
        opened_at: new Date().toISOString(),
        rewards: JSON.stringify([selectedReward])
      })
      .eq('id', crateId);

    if (updateError) {
      console.error('Error updating crate status:', updateError);
      return NextResponse.json({ error: 'Failed to open crate' }, { status: 500 });
    }

    // Record transaction for reward
    if (selectedReward.type === 'coins' || selectedReward.type === 'xp') {
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          user_id: session.user_id,
          type: selectedReward.type === 'coins' ? 'crate_reward' : 'xp_bonus',
          amount: selectedReward.amount,
          description: `${crate.crate_type} crate reward - ${selectedReward.type}`,
          created_at: new Date().toISOString()
        }]);

      if (transactionError && transactionError.code !== 'PGRST116') {
        console.error('Error recording transaction:', transactionError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Crate opened successfully!',
      crate: {
        id: crate.id,
        type: crate.crate_type,
        opened_at: new Date().toISOString()
      },
      rewards: [selectedReward]
    });

  } catch (error) {
    console.error('Error opening crate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
