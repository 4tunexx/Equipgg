import { NextRequest } from 'next/server';
import { parse } from 'cookie';
import { getDb, getOne, getAll } from '@/lib/db';

export interface AuthSession {
  user_id: string;
  email: string;
  role: string;
  token: string;
}

export async function getAuthSession(request: NextRequest): Promise<AuthSession | null> {
  try {
    // Get session from cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      console.log('No cookie header found');
      return null;
    }

    const cookies = parse(cookieHeader);
    let sessionToken = cookies['equipgg_session'];
    
    if (!sessionToken) {
      console.log('No session token found in cookies');
      return null;
    }
    
    console.log('Session token found:', sessionToken.substring(0, 8) + '...');
    
    // CRITICAL FIX: Use synchronous database access to avoid race conditions
    const db = await getDb();
    
    // Get session and user info with retry logic
    let session = null;
    let retryCount = 0;
    const maxRetries = 3; // Reduced retries to avoid long delays
    
    // Add a small delay to prevent race conditions
    await new Promise(resolve => setTimeout(resolve, 10));
    
    while (!session && retryCount < maxRetries) {
      try {
        // First check if session exists at all
        const sessionExists = await getOne<{token: string, user_id: string}>(
          'SELECT token, user_id FROM sessions WHERE token = ?',
          [sessionToken]
        );
        
        if (!sessionExists) {
          console.log(`Session token ${sessionToken.substring(0, 8)}... does not exist in database`);
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Session not found, retrying... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 200)); // Longer delay
          }
          continue;
        }
        
        // Now get full session with user info
        session = await getOne<AuthSession>(
          'SELECT s.*, u.email, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?',
          [sessionToken]
        );
        
        if (session) {
          console.log('Session found for user:', session.email, 'role:', session.role);
          return session;
        } else {
          console.log(`Session exists but user join failed for token ${sessionToken.substring(0, 8)}...`);
          
          // Try alternative query without JOIN
          const sessionOnly = await getOne<{user_id: string, token: string}>(
            'SELECT user_id, token FROM sessions WHERE token = ?',
            [sessionToken]
          );
          
          if (sessionOnly) {
            const user = await getOne<{email: string, role: string}>(
              'SELECT email, role FROM users WHERE id = ?',
              [sessionOnly.user_id]
            );
            
            if (user) {
              console.log('Session found via alternative query for user:', user.email, 'role:', user.role);
              return {
                user_id: sessionOnly.user_id,
                email: user.email,
                role: user.role,
                token: sessionToken
              };
            }
          }
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Session not found, retrying... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 200)); // Longer delay
        }
      } catch (error) {
        console.error(`Session lookup error (attempt ${retryCount + 1}):`, error);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
    
    console.log('No session found for token:', sessionToken.substring(0, 8) + '...');
    return null;
    
  } catch (error) {
    console.error('Auth session error:', error);
    return null;
  }
}

export function createUnauthorizedResponse() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export function createForbiddenResponse(message = 'Forbidden') {
  return Response.json({ error: message }, { status: 403 });
}

// Session repair function to fix corrupted sessions
export async function repairCorruptedSession(sessionToken: string): Promise<AuthSession | null> {
  try {
    await getDb();
    
    // Check if session exists
    const sessionOnly = await getOne<{user_id: string, token: string, created_at: string}>('SELECT * FROM sessions WHERE token = ?', [sessionToken]);
    if (!sessionOnly) {
      console.log('Session does not exist, cannot repair');
      return null;
    }
    
    // Check if user exists
    const userExists = await getOne<{id: string, email: string, role: string}>('SELECT id, email, role FROM users WHERE id = ?', [sessionOnly.user_id]);
    if (!userExists) {
      console.log('User does not exist, cannot repair session');
      return null;
    }
    
    console.log('Repairing corrupted session for user:', userExists.email);
    
    // Return repaired session
    return {
      user_id: sessionOnly.user_id as string,
      email: userExists.email,
      role: userExists.role,
      token: sessionToken
    };
  } catch (error) {
    console.error('Error repairing session:', error);
    return null;
  }
}