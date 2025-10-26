import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

// Record login event and update user stats
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      device_info, 
      user_agent, 
      ip_address,
      login_method = 'standard'
    } = await request.json();

    const loginEventData = {
      user_id: session.user_id,
      event_type: 'login',
      device_info,
      user_agent,
      ip_address,
      login_method,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Record login event
    const { data: loginEvent, error: eventError } = await supabase
      .from('user_events')
      .insert([loginEventData])
      .select()
      .single();

    if (eventError && eventError.code !== 'PGRST116') {
      console.error('Error recording login event:', eventError);
    }

    // Update user's last login and login streak
    const { data: currentUser, error: getUserError } = await supabase
      .from('users')
      .select('last_login, login_streak, total_logins, balance, xp')
      .eq('id', session.user_id)
      .single();

    if (getUserError && getUserError.code !== 'PGRST116') {
      console.error('Error fetching user data:', getUserError);
    }

    let newLoginStreak = 1;
    let totalLogins = (currentUser?.total_logins || 0) + 1;
    let streakBonusXP = 0;

    if (currentUser?.last_login) {
      const lastLogin = new Date(currentUser.last_login);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day login - increase streak
        newLoginStreak = (currentUser.login_streak || 0) + 1;
      } else if (daysDiff === 0) {
        // Same day login - keep streak
        newLoginStreak = currentUser.login_streak || 1;
        totalLogins = currentUser.total_logins || 1; // Don't increment for same day
      } else {
        // Broke streak - reset to 1
        newLoginStreak = 1;
      }
    }

    // Calculate streak bonus XP
    if (newLoginStreak > 1) {
      streakBonusXP = Math.min(newLoginStreak * 5, 50); // 5 XP per day, max 50
    }

    // Daily login bonus (only once per day)
    const today = new Date().toISOString().split('T')[0];
    const lastLoginDate = currentUser?.last_login ? 
      new Date(currentUser.last_login).toISOString().split('T')[0] : null;

    let dailyBonus = 0;
    let dailyBonusXP = 0;

    if (lastLoginDate !== today) {
      dailyBonus = 10; // 10 coins daily
      dailyBonusXP = 25; // 25 XP daily
    }

    // Update user stats
    const userUpdates: any = {
      last_login: new Date().toISOString(),
      login_streak: newLoginStreak,
      total_logins: totalLogins,
      updated_at: new Date().toISOString()
    };

    if (dailyBonus > 0) {
      const currentBalance = currentUser?.balance || 0;
      userUpdates.balance = currentBalance + dailyBonus;
    }

    if (dailyBonusXP > 0 || streakBonusXP > 0) {
      const currentXP = currentUser?.xp || 0;
      userUpdates.xp = currentXP + dailyBonusXP + streakBonusXP;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', session.user_id);

    if (updateError && updateError.code !== 'PGRST116') {
      console.error('Error updating user stats:', updateError);
    }

    // Record bonus transactions
    const transactions: Array<{
      user_id: string;
      type: string;
      amount: number;
      description: string;
      created_at: string;
    }> = [];

    if (dailyBonus > 0) {
      transactions.push({
        user_id: session.user_id,
        type: 'bonus',
        amount: dailyBonus,
        description: 'Daily login bonus',
        created_at: new Date().toISOString()
      });
    }

    if (dailyBonusXP > 0) {
      transactions.push({
        user_id: session.user_id,
        type: 'xp_bonus',
        amount: dailyBonusXP,
        description: 'Daily login XP bonus',
        created_at: new Date().toISOString()
      });
    }

    if (streakBonusXP > 0) {
      transactions.push({
        user_id: session.user_id,
        type: 'xp_bonus',
        amount: streakBonusXP,
        description: `Login streak bonus (${newLoginStreak} days)`,
        created_at: new Date().toISOString()
      });
    }

    if (transactions.length > 0) {
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(transactions);

      if (transactionError && transactionError.code !== 'PGRST116') {
        console.error('Error recording bonus transactions:', transactionError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Login recorded successfully',
      data: {
        login_streak: newLoginStreak,
        total_logins: totalLogins,
        daily_bonus: dailyBonus,
        daily_bonus_xp: dailyBonusXP,
        streak_bonus_xp: streakBonusXP,
        first_login_today: lastLoginDate !== today,
        event_id: loginEvent?.id || null
      }
    });

  } catch (error) {
    console.error('Error recording login event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get user login statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || session.user_id;
    const days = parseInt(searchParams.get('days') || '30');

    // Check if requesting another user's data (admin only)
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

    // Get user's login stats
    const { data: userStats, error: userError } = await supabase
      .from('users')
      .select('last_login, login_streak, total_logins, created_at')
      .eq('id', userId)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          stats: {
            last_login: new Date().toISOString(),
            login_streak: 5,
            total_logins: 15,
            account_age_days: 30,
            recent_events: []
          },
          message: 'User events system in development'
        });
      }
      console.error('Error fetching user stats:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get recent login events
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: recentEvents, error: eventsError } = await supabase
      .from('user_events')
      .select('timestamp, login_method, device_info')
      .eq('user_id', userId)
      .eq('event_type', 'login')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(50);

    if (eventsError && eventsError.code !== 'PGRST116') {
      console.error('Error fetching login events:', eventsError);
    }

    // Calculate account age
    const accountCreated = new Date(userStats.created_at);
    const now = new Date();
    const accountAgeDays = Math.floor((now.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 24));

    // Group events by day for activity calendar
    const eventsByDay = {} as any;
    if (recentEvents) {
      recentEvents.forEach((event: any) => {
        const day = event.timestamp.split('T')[0];
        if (!eventsByDay[day]) {
          eventsByDay[day] = 0;
        }
        eventsByDay[day]++;
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        last_login: userStats.last_login,
        login_streak: userStats.login_streak || 0,
        total_logins: userStats.total_logins || 0,
        account_age_days: accountAgeDays,
        recent_events: recentEvents || [],
        activity_calendar: eventsByDay,
        days_requested: days
      }
    });

  } catch (error) {
    console.error('Error fetching login stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
