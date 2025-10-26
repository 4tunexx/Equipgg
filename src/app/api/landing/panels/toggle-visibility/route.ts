import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../../lib/auth-utils';
import { supabase } from "../../../../../lib/supabase";

// Admin-only: Toggle panel visibility
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

    const { panelId, visible } = await request.json();

    if (!panelId) {
      return NextResponse.json({ 
        error: 'Panel ID is required' 
      }, { status: 400 });
    }

    if (typeof visible !== 'boolean') {
      return NextResponse.json({ 
        error: 'Visible must be a boolean value' 
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
          message: `Panel visibility ${visible ? 'enabled' : 'disabled'} (development mode)`,
          panel: {
            id: panelId,
            visible
          }
        });
      }
      console.error('Error fetching panel:', panelError);
      return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
    }

    // Check if visibility is already the desired state
    if (currentPanel.is_visible === visible) {
      return NextResponse.json({
        success: true,
        message: `Panel is already ${visible ? 'visible' : 'hidden'}`,
        panel: {
          id: panelId,
          title: currentPanel.title,
          visible
        }
      });
    }

    // Update panel visibility
    const { data: updatedPanel, error: updateError } = await supabase
      .from('landing_panels')
      .update({
        is_visible: visible,
        updated_at: new Date().toISOString()
      })
      .eq('id', panelId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating panel visibility:', updateError);
      return NextResponse.json({ error: 'Failed to update panel visibility' }, { status: 500 });
    }

    // Log admin action
    const { error: logError } = await supabase
      .from('admin_logs')
      .insert([{
        admin_id: session.user_id,
        action: 'toggle_panel_visibility',
        details: JSON.stringify({
          panelId,
          oldVisibility: currentPanel.is_visible,
          newVisibility: visible,
          panelTitle: currentPanel.title
        }),
        created_at: new Date().toISOString()
      }]);

    if (logError && logError.code !== 'PGRST116') {
      console.error('Error logging admin action:', logError);
    }

    return NextResponse.json({
      success: true,
      message: `Panel "${currentPanel.title}" is now ${visible ? 'visible' : 'hidden'}`,
      panel: {
        id: updatedPanel.id,
        title: updatedPanel.title,
        visible: updatedPanel.is_visible,
        type: updatedPanel.panel_type,
        display_order: updatedPanel.display_order
      }
    });

  } catch (error) {
    console.error('Error toggling panel visibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get panel visibility status
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const panelId = searchParams.get('panelId');

    if (panelId) {
      // Get specific panel visibility
      const { data: panel, error: panelError } = await supabase
        .from('landing_panels')
        .select('id, title, panel_type, is_visible, display_order')
        .eq('id', panelId)
        .single();

      if (panelError) {
        if (panelError.code === 'PGRST116') {
          return NextResponse.json({
            success: true,
            panel: {
              id: panelId,
              title: 'Sample Panel',
              panel_type: 'info',
              is_visible: true,
              display_order: 1
            },
            message: 'Panels system in development'
          });
        }
        console.error('Error fetching panel:', panelError);
        return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        panel
      });

    } else {
      // Get all panels with visibility status
      const { data: panels, error: panelsError } = await supabase
        .from('landing_panels')
        .select('id, title, panel_type, is_visible, display_order')
        .order('display_order', { ascending: true });

      if (panelsError) {
        if (panelsError.code === 'PGRST116') {
          return NextResponse.json({
            success: true,
            panels: [
              {
                id: '1',
                title: 'Welcome Panel',
                panel_type: 'hero',
                is_visible: true,
                display_order: 1
              },
              {
                id: '2',
                title: 'Games Panel',
                panel_type: 'games',
                is_visible: true,
                display_order: 2
              },
              {
                id: '3',
                title: 'Stats Panel',
                panel_type: 'stats',
                is_visible: false,
                display_order: 3
              }
            ],
            summary: {
              total: 3,
              visible: 2,
              hidden: 1
            },
            message: 'Panels system in development'
          });
        }
        console.error('Error fetching panels:', panelsError);
        return NextResponse.json({ error: 'Failed to fetch panels' }, { status: 500 });
      }

      // Calculate summary
      const visible = panels?.filter((p: any) => p.is_visible).length || 0;
      const hidden = panels?.filter((p: any) => !p.is_visible).length || 0;

      return NextResponse.json({
        success: true,
        panels: panels || [],
        summary: {
          total: panels?.length || 0,
          visible,
          hidden
        }
      });
    }

  } catch (error) {
    console.error('Error fetching panel visibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
