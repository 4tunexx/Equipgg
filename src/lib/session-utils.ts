import { NextRequest } from 'next/server';

export interface SessionData {
  user_id: string;
  email: string;
  role: string;
  provider: string;
  expires_at: number;
  [key: string]: any;
}

/**
 * Extract user ID from session cookie
 * Tries both equipgg_session (httpOnly) and equipgg_session_client (readable) cookies
 */
export function getUserIdFromCookie(request: NextRequest): string | null {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Try both equipgg_session and equipgg_session_client
    let cookieMatch = cookieHeader.match(/equipgg_session=([^;]+)/);
    if (!cookieMatch) {
      cookieMatch = cookieHeader.match(/equipgg_session_client=([^;]+)/);
    }
    
    if (!cookieMatch) {
      return null;
    }

    // The cookie might be double-encoded, so decode twice if needed
    let cookieValue = decodeURIComponent(cookieMatch[1]);
    
    // Check if still encoded (starts with %7B which is { encoded)
    if (cookieValue.startsWith('%7B') || cookieValue.startsWith('%22')) {
      cookieValue = decodeURIComponent(cookieValue);
    }

    const sessionData = JSON.parse(cookieValue) as SessionData;
    
    // Check if session is expired
    if (sessionData.expires_at && Date.now() >= sessionData.expires_at) {
      return null;
    }
    
    return sessionData.user_id || null;
  } catch (e) {
    console.error('Failed to parse session cookie:', e);
    return null;
  }
}

/**
 * Get full session data from cookie
 */
export function getSessionFromCookie(request: NextRequest): SessionData | null {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Try both equipgg_session and equipgg_session_client
    let cookieMatch = cookieHeader.match(/equipgg_session=([^;]+)/);
    if (!cookieMatch) {
      cookieMatch = cookieHeader.match(/equipgg_session_client=([^;]+)/);
    }
    
    if (!cookieMatch) {
      return null;
    }

    // The cookie might be double-encoded, so decode twice if needed
    let cookieValue = decodeURIComponent(cookieMatch[1]);
    
    // Check if still encoded (starts with %7B which is { encoded)
    if (cookieValue.startsWith('%7B') || cookieValue.startsWith('%22')) {
      cookieValue = decodeURIComponent(cookieValue);
    }

    const sessionData = JSON.parse(cookieValue) as SessionData;
    
    // Check if session is expired
    if (sessionData.expires_at && Date.now() >= sessionData.expires_at) {
      return null;
    }
    
    return sessionData;
  } catch (e) {
    console.error('Failed to parse session cookie:', e);
    return null;
  }
}
