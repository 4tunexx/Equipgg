import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Use Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Return session and user info
    return NextResponse.json({ ok: true, session: data.session, user: data.user });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
          createdAt: {
            lt: oneDayAgo
          }
        }
      });
      
      await prisma.session.create({
        data: {
          token,
          userId: user.id,
          createdAt: loginTime
        }
      });
      
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: loginTime }
      });
    } else {
      // Use SQLite for session management
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await run('DELETE FROM sessions WHERE user_id = ? AND created_at < ?', [user.id, oneDayAgo]);
      await run('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)', [token, user.id, loginTime.toISOString()]);
      await run('UPDATE users SET lastLoginAt = ? WHERE id = ?', [loginTime.toISOString(), user.id]);
      
      // Persist SQLite changes
      const db = await getDb();
      await db.export();
    }
    
    // Track mission progress
    await trackLogin(user.id);
    
    const res = NextResponse.json({ 
      ok: true, 
      user: {
        id: user.id,
        email: user.email,
        displayName: usePrisma ? user.displayName : user.displayName,
        avatarUrl: usePrisma ? user.avatarUrl : user.avatar_url,
        role: user.role,
        return NextResponse.json({ ok: true, session: data.session, user: data.user });
      } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }
    const cookieValue = serialize(COOKIE_NAME, token, { 

      httpOnly: true, 

      path: '/', 
