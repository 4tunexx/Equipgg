import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from "../../../../lib/auth-utils";
import { createSupabaseQueries } from "../../../../lib/supabase/queries";
import { supabase } from "../../../../lib/supabase/client";
import { createClient } from '@supabase/supabase-js';
import { createNotification } from "../../../../lib/notification-utils";

// Create Supabase admin client for secure operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin') {
      return createForbiddenResponse('Only admins can give crate keys.');
    }

    const { userId, crateId, keysCount } = await request.json();

    if (!userId || crateId === undefined || !keysCount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const queries = createSupabaseQueries(supabaseAdmin);
    
    // Get crate info for notification
    const { data: crate } = await supabaseAdmin
      .from('crates')
      .select('name')
      .eq('id', Number(crateId))
      .single();
    
    // Add keys to user (crateId should be number)
    await queries.addCrateKeys(userId, Number(crateId), Number(keysCount));

    // Create notification for the user
    try {
      await createNotification({
        userId,
        type: 'reward',
        title: '🎁 Crate Keys Received!',
        message: `An admin awarded you ${keysCount} ${crate?.name || 'crate'} key${keysCount > 1 ? 's' : ''}! Click to open them now.`,
        data: {
          crateId: Number(crateId),
          crateName: crate?.name,
          keysCount,
          linkTo: '/dashboard/crates'
        }
      });
      console.log('✅ Notification created for user:', userId);
    } catch (notificationError) {
      console.error('⚠️ Failed to create notification (but keys were added):', notificationError);
      // Continue even if notification fails
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${keysCount} keys for crate ${crateId} to user ${userId}`
    });

  } catch (error) {
    console.error('Error giving crate keys:', error);
    return NextResponse.json(
      { error: 'Failed to give crate keys', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
