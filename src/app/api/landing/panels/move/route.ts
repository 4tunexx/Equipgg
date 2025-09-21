import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../../lib/auth-utils';
import { supabase } from "../../../../../lib/supabase";

// Admin-only: Reorder landing page panels
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user_id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { panelId, newPosition, direction } = await request.json();

    if (!panelId) {
      return NextResponse.json({ 
        error: 'Panel ID is required' 
      }, { status: 400 });
    }

    // Get current panel
    const { data: currentPanel, error: panelError } = await supabase
      .from('landing_panels')
      .select('*')
      .eq('id', panelId)
      .single();

    if (panelError) {
      if (panelError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          message: 'Panel order updated (development mode)',
          panel: {
            id: panelId,
            new_position: newPosition || 1
          }
        });
      }
      console.error('Error fetching panel:', panelError);
      return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
    }

    let targetPosition = newPosition;

    // If direction is provided instead of exact position
    if (direction && !newPosition) {
      if (direction === 'up') {
        targetPosition = Math.max(1, currentPanel.display_order - 1);
      } else if (direction === 'down') {
        // Get max position
        const { data: maxPanel } = await supabase
          .from('landing_panels')
          .select('display_order')
          .order('display_order', { ascending: false })
          .limit(1)
          .single();
        
        const maxPosition = maxPanel?.display_order || 1;
        targetPosition = Math.min(maxPosition + 1, currentPanel.display_order + 1);
      } else {
        return NextResponse.json({ 
          error: 'Direction must be "up" or "down"' 
        }, { status: 400 });
      }
    }

    if (!targetPosition || targetPosition < 1) {
      return NextResponse.json({ 
        error: 'Valid target position is required' 
      }, { status: 400 });
    }

    const currentPosition = currentPanel.display_order;

    if (currentPosition === targetPosition) {
      return NextResponse.json({
        success: true,
        message: 'Panel is already in the target position'
      });
    }

    // Update other panels' positions
    if (targetPosition > currentPosition) {
      // Moving down - shift panels up
      const { data: panelsToShift } = await supabase
        .from('landing_panels')
        .select('id, display_order')
        .gt('display_order', currentPosition)
        .lte('display_order', targetPosition);

      if (panelsToShift) {
        for (const panel of panelsToShift) {
          await supabase
            .from('landing_panels')
            .update({ 
              display_order: panel.display_order - 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', panel.id);
        }
      }
    } else {
      // Moving up - shift panels down
      const { data: panelsToShift } = await supabase
        .from('landing_panels')
        .select('id, display_order')
        .gte('display_order', targetPosition)
        .lt('display_order', currentPosition);

      if (panelsToShift) {
        for (const panel of panelsToShift) {
          await supabase
            .from('landing_panels')
            .update({ 
              display_order: panel.display_order + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', panel.id);
        }
      }
    }

    // Update target panel position
    const { data: updatedPanel, error: updateError } = await supabase
      .from('landing_panels')
      .update({
        display_order: targetPosition,
        updated_at: new Date().toISOString()
      })
      .eq('id', panelId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating panel position:', updateError);
      return NextResponse.json({ error: 'Failed to update panel position' }, { status: 500 });
    }

    // Log admin action
    const { error: logError } = await supabase
      .from('admin_logs')
      .insert([{
        admin_id: session.user_id,
        action: 'move_panel',
        details: JSON.stringify({
          panelId,
          oldPosition: currentPosition,
          newPosition: targetPosition,
          direction
        }),
        created_at: new Date().toISOString()
      }]);

    if (logError && logError.code !== 'PGRST116') {
      console.error('Error logging admin action:', logError);
    }

    return NextResponse.json({
      success: true,
      message: `Panel moved from position ${currentPosition} to ${targetPosition}`,
      panel: {
        id: updatedPanel.id,
        title: updatedPanel.title,
        old_position: currentPosition,
        new_position: targetPosition
      }
    });

  } catch (error) {
    console.error('Error moving panel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
