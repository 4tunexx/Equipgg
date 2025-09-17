import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, run, getOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await getDb();

    if (!session.user_id) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 400 });
    }

    // Check if user already has VIP
    const user = await getOne(`
      SELECT role, gems FROM users WHERE id = ?
    `, [session.user_id]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'vip' || user.role === 'admin') {
      return NextResponse.json({ error: 'User already has VIP status' }, { status: 400 });
    }

    // Check if user has enough gems (100 gems for VIP upgrade)
    const vipCost = 100;
    if (user.gems < vipCost) {
      return NextResponse.json({ 
        error: 'Insufficient gems', 
        required: vipCost,
        current: user.gems 
      }, { status: 400 });
    }

    // Deduct gems and upgrade to VIP
    run(`
      UPDATE users 
      SET gems = gems - ?, role = 'vip'
      WHERE id = ?
    `, [vipCost, session.user_id]);

    return NextResponse.json({
      success: true,
      message: 'Successfully upgraded to VIP!',
      newRole: 'vip',
      gemsDeducted: vipCost,
      remainingGems: user.gems - vipCost
    });

  } catch (error) {
    console.error('Error upgrading to VIP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
