import { NextRequest, NextResponse } from 'next/server';

export interface AuthSession {
  user_id: string;
  email: string;
  role: string;
}

export async function getAuthSession(request: NextRequest): Promise<AuthSession | null> {
  return null;
}

export function createUnauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function createForbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}
