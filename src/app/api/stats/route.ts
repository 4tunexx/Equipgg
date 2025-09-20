import { NextResponse } from 'next/server';
import { supabase } from "../../../lib/supabase";

export async function GET() {
  try {
    // Get real stats from Supabase
    const [{ count: totalUsers }, { count: totalBets }, coinsRes, { count: usersOnline }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('user_bets').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('coins'),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('lastLoginAt', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);
    let totalCoins = 0;
    if (Array.isArray(coinsRes.data)) {
      totalCoins = coinsRes.data.reduce((sum: number, u: any) => sum + (u.coins || 0), 0);
    }
    const stats = {
      usersOnline: usersOnline || 0,
      totalCoins,
      totalBets: totalBets || 0,
      totalUsers: totalUsers || 0,
    };
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}