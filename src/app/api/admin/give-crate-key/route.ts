import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from "../../../../lib/auth-utils";
import { createSupabaseQueries } from "../../../../lib/supabase/queries";
import { supabase } from "../../../../lib/supabase/client";
import { createServerSupabaseClient } from '@/lib/supabase';
import { createNotification } from "../../../../lib/notification-utils";

// Supabase admin client will be created inside the handler when needed

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createServerSupabaseClient();
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
    console.log('\n🔔🔔🔔 ADMIN GIVE KEY - NOTIFICATION CREATION START 🔔🔔🔔');
    try {
      console.log('🔔 Creating key reward notification for user:', userId);
      console.log('📦 Notification data:', {
        userId,
        type: 'reward',
        keysCount,
        crateName: crate?.name,
        crateId: Number(crateId)
      });
      
      console.log('🚀 Calling createNotification utility...');
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
      console.log('✅✅✅ Key reward notification created successfully for user:', userId);
      console.log('🔔🔔🔔 ADMIN GIVE KEY - NOTIFICATION CREATION COMPLETE 🔔🔔🔔\n');
    } catch (notificationError) {
      console.error('❌❌❌ Failed to create notification (but keys were added):', notificationError);
      console.error('💥 Error details:', JSON.stringify(notificationError, null, 2));
      console.error('💥 Error message:', notificationError instanceof Error ? notificationError.message : 'Unknown error');
      console.error('💥 Stack:', notificationError instanceof Error ? notificationError.stack : 'No stack trace');
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
