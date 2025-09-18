import { NextRequest, NextResponse } from 'next/server';
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthSession {
  user_id: string;
  email: string;
  role: string;
  session: Session;
}

export async function getAuthSession(request: NextRequest): Promise<AuthSession | null> {
  try {
    // Get session token from cookie
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      console.log('No valid session found');
      return null;
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      console.log('No user profile found');
      return null;
    }

    return {
      user_id: session.user.id,
      email: session.user.email || '',
      role: profile.role || 'user',
      session
    };
  } catch (error) {
    console.error('Auth session error:', error);
    return null;
  }
}

export function createUnauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function createForbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

// Session repair function to attempt recovery of a corrupted session
export async function repairCorruptedSession(sessionToken: string): Promise<AuthSession | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      console.log('No valid session to repair');
      return null;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      console.log('User profile not found for repair');
      return null;
    }

    return {
      user_id: session.user.id,
      email: session.user.email || '',
      role: profile.role || 'user',
      session
    };
  } catch (error) {
    console.error('Error repairing session:', error);
    return null;
  }
}