import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../lib/auth-utils";
import { secureDb } from "../../../lib/secure-db";

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  role: string;
  coins: number;
  gems: number;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    
    if (!session) {
      return NextResponse.json({ user: null });
    }
    
    const user = await secureDb.findOne<User>('users', { id: session.user_id });
    if (user) {
      // Map to expected frontend fields
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl || null,
          xp: user.xp,
          level: user.level,
          role: user.role,
          coins: user.coins,
          gems: user.gems,
        }
      });
    }
    return NextResponse.json({ user: null });
  } catch (error) {
    console.error('Error in /api/me:', error);
    return NextResponse.json({ user: null, error: 'Internal error' });
  }
}


