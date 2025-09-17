import { NextRequest, NextResponse } from 'next/server';
import { getDb, getOne, getAll, run } from '@/lib/db';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';
import { parse } from 'cookie';

// GET /api/admin/matches - Get all matches for admin management
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    // Get all matches
    const matches = await getAll(`
      SELECT * FROM matches 
      ORDER BY match_date DESC, start_time DESC
    `, []);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/matches - Create new match
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return createUnauthorizedResponse();
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return createForbiddenResponse('Admin access required');
    }

    const {
      team_a_name,
      team_a_logo,
      team_a_odds,
      team_b_name,
      team_b_logo,
      team_b_odds,
      event_name,
      map,
      start_time,
      match_date,
      stream_url,
      status = 'upcoming'
    } = await request.json();

    if (!team_a_name || !team_b_name || !event_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create match
    const result = await run(`
      INSERT INTO matches (
        team_a_name, team_a_logo, team_a_odds,
        team_b_name, team_b_logo, team_b_odds,
        event_name, map, start_time, match_date, stream_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      team_a_name, team_a_logo, team_a_odds,
      team_b_name, team_b_logo, team_b_odds,
      event_name, map, start_time, match_date, stream_url, status
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Match created successfully',
      matchId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/matches - Update match
export async function PUT(request: NextRequest) {
  try {
    // Get session from cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookies = parse(cookieHeader);
    const sessionToken = cookies['equipgg_session'];
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    
    // Get session and user info
    const session = await getOne(
      'SELECT s.*, u.email, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?',
      [sessionToken]
    );
    
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { matchId, updates } = await request.json();
    
    if (!matchId || !updates) {
      return NextResponse.json({ error: 'Missing matchId or updates' }, { status: 400 });
    }

    // Build dynamic update query
    const allowedFields = [
      'team_a_name', 'team_a_logo', 'team_a_odds',
      'team_b_name', 'team_b_logo', 'team_b_odds',
      'event_name', 'map', 'start_time', 'match_date', 'stream_url', 'status'
    ];
    const updateFields = [];
    const updateValues = [];
    
    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        updateFields.push(`${field} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    
    updateValues.push(matchId);
    
    const updateQuery = `UPDATE matches SET ${updateFields.join(', ')} WHERE id = ?`;
    
    await run(updateQuery, updateValues);

    return NextResponse.json({ success: true, message: 'Match updated successfully' });
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/matches - Delete match
export async function DELETE(request: NextRequest) {
  try {
    // Get session from cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookies = parse(cookieHeader);
    const sessionToken = cookies['equipgg_session'];
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    
    // Get session and user info
    const session = await getOne(
      'SELECT s.*, u.email, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?',
      [sessionToken]
    );
    
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    // Check if user is admin
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { matchId } = await request.json();
    
    if (!matchId) {
      return NextResponse.json({ error: 'Missing matchId' }, { status: 400 });
    }

    // Delete related bets first
    await run('DELETE FROM user_bets WHERE match_id = ?', [matchId]);
    
    // Delete match
    await run('DELETE FROM matches WHERE id = ?', [matchId]);

    return NextResponse.json({ success: true, message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}