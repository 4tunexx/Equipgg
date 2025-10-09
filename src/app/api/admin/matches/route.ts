import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '../../../../lib/auth-utils';
import { secureDb } from '../../../../lib/secure-db';
import { processMatchResults, syncMatchesFromPandaScore } from '../../../../lib/pandascore';
import { processBetsForMatch } from '../../../../lib/bet-result-processor';

// GET: list matches (admin)
export async function GET(request: NextRequest) {
  const session = await getAuthSession(request);
  if (!session) return createUnauthorizedResponse();
  if (session.role !== 'admin') return createForbiddenResponse('Admin access required');
  const matches = await secureDb.findMany<any>('matches', {}, { orderBy: 'created_at DESC', limit: 500 });
  return NextResponse.json({ matches: matches || [] });
}

// POST: create match (admin)
export async function POST(request: NextRequest) {
  const session = await getAuthSession(request);
  if (!session) return createUnauthorizedResponse();
  if (session.role !== 'admin') return createForbiddenResponse('Admin access required');
  try {
    const body = await request.json();
    const required = ['team_a_name','team_b_name','event_name'];
    for (const k of required) {
      if (!body?.[k] || String(body[k]).trim() === '') {
        return NextResponse.json({ error: `Missing required field: ${k}` }, { status: 400 });
      }
    }
    const payload: any = {
      team_a_name: body.team_a_name,
      team_a_logo: body.team_a_logo || '',
      team_a_odds: typeof body.team_a_odds === 'number' ? body.team_a_odds : 1.0,
      team_b_name: body.team_b_name,
      team_b_logo: body.team_b_logo || '',
      team_b_odds: typeof body.team_b_odds === 'number' ? body.team_b_odds : 1.0,
      event_name: body.event_name,
      map: body.map || '',
      start_time: body.start_time || '',
      match_date: body.match_date || '',
      stream_url: body.stream_url || '',
      status: body.status || 'upcoming',
      is_visible: body.is_visible !== undefined ? !!body.is_visible : true,
    };
    const created = await secureDb.create('matches', payload);
    if (!created) return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
    return NextResponse.json({ success: true, match: created });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
// End of file
// PUT: update a match (admin)
export async function PUT(request: NextRequest) {
  const session = await getAuthSession(request);
  if (!session) return createUnauthorizedResponse();
  if (session.role !== 'admin') return createForbiddenResponse('Admin access required');
  try {
    const { matchId, updates } = await request.json();
    if (!matchId || !updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'matchId and updates are required' }, { status: 400 });
    }
    const updated = await secureDb.update('matches', { id: matchId }, updates);
    if (!updated) return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
    return NextResponse.json({ success: true, match: updated });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}

// PATCH: toggle visibility or small updates (admin)
export async function PATCH(request: NextRequest) {
  const session = await getAuthSession(request);
  if (!session) return createUnauthorizedResponse();
  if (session.role !== 'admin') return createForbiddenResponse('Admin access required');
  try {
    const body = await request.json();
    const { matchId, is_visible, updates } = body || {};
    if (matchId && typeof is_visible === 'boolean') {
      const updated = await secureDb.update('matches', { id: matchId }, { is_visible });
      if (!updated) return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 });
      return NextResponse.json({ success: true, match: updated });
    }
    if (matchId && updates && typeof updates === 'object') {
      const updated = await secureDb.update('matches', { id: matchId }, updates);
      if (!updated) return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
      return NextResponse.json({ success: true, match: updated });
    }
    return NextResponse.json({ error: 'Invalid PATCH payload' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}

// DELETE: delete one, many, or all matches (admin)
export async function DELETE(request: NextRequest) {
  const session = await getAuthSession(request);
  if (!session) return createUnauthorizedResponse();
  if (session.role !== 'admin') return createForbiddenResponse('Admin access required');
  try {
    const body = await request.json();
    const { matchId, ids, deleteAll } = body || {};
    let deletedCount = 0;
    // helper to delete a single match with dependent cleanup
    const deleteOne = async (id: string) => {
      await secureDb.delete('user_bets', { match_id: id });
      const ok = await secureDb.delete('matches', { id });
      return ok;
    };
    if (deleteAll) {
      const all = await secureDb.findMany<{ id: string }>('matches');
      for (const m of all) {
        if (await deleteOne(m.id)) deletedCount += 1;
      }
      return NextResponse.json({ success: true, deleted: deletedCount });
    }
    if (Array.isArray(ids) && ids.length > 0) {
      for (const id of ids) {
        if (await deleteOne(id)) deletedCount += 1;
      }
      return NextResponse.json({ success: true, deleted: deletedCount });
    }
    if (matchId) {
      if (!(await deleteOne(matchId))) return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 });
      return NextResponse.json({ success: true, deleted: 1 });
    }
    return NextResponse.json({ error: 'Provide matchId, ids[], or deleteAll: true' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
