import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAuthSession } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirmation } = await request.json();

    if (confirmation !== 'DELETE') {
      return NextResponse.json(
        { error: 'Please type DELETE to confirm account deletion' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Soft delete - mark user as deleted instead of actually deleting
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        email: `deleted_${session.user_id}@deleted.com`,
        username: `deleted_${session.user_id}`,
        displayname: 'Deleted User'
      })
      .eq('id', session.user_id);

    if (updateError) {
      console.error('Error deleting account:', updateError);
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      );
    }

    // Clear session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });

    response.cookies.set('equipgg_session', '', { maxAge: 0 });
    response.cookies.set('equipgg_session_client', '', { maxAge: 0 });

    return response;

  } catch (error) {
    console.error('Delete account API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

