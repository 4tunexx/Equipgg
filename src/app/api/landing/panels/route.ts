import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

// Landing page content panels management
export async function GET(request: NextRequest) {
  try {
    // Get active content panels
    const { data: panels, error } = await supabase
      .from('landing_panels')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching panels:', error);
      return NextResponse.json({ error: 'Failed to fetch panels' }, { status: 500 });
    }

    // If table doesn't exist, return default panels
    if (error && error.code === 'PGRST116') {
      const defaultPanels = [
        {
          id: '1',
          type: 'hero',
          title: 'Welcome to EquipGG',
          content: 'The ultimate destination for CS2 gambling and gaming excitement.',
          image_url: '/logo.png',
          button_text: 'Get Started',
          button_url: '/auth',
          is_active: true,
          display_order: 1
        },
        {
          id: '2',
          type: 'features',
          title: 'Game Features',
          content: 'Experience thrilling games like Crash, Coinflip, Plinko, and Sweeper with fair and transparent gameplay.',
          icon: 'gamepad',
          is_active: true,
          display_order: 2
        },
        {
          id: '3',
          type: 'stats',
          title: 'Platform Statistics',
          content: 'Join thousands of players and millions in winnings.',
          stats: {
            users: '10,000+',
            games: '1M+',
            winnings: '$5M+'
          },
          is_active: true,
          display_order: 3
        },
        {
          id: '4',
          type: 'testimonial',
          title: 'What Players Say',
          content: 'Best CS2 gambling platform I\'ve used. Fair games and fast withdrawals!',
          author: 'ProGamer123',
          is_active: true,
          display_order: 4
        }
      ];

      return NextResponse.json({
        success: true,
        panels: defaultPanels
      });
    }

    return NextResponse.json({
      success: true,
      panels: panels || []
    });

  } catch (error) {
    console.error('Error in panels GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin only - create new panel
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

    const { 
      type, 
      title, 
      content, 
      image_url, 
      icon, 
      button_text, 
      button_url, 
      stats, 
      author, 
      display_order = 999 
    } = await request.json();

    if (!type || !title || !content) {
      return NextResponse.json({ 
        error: 'Type, title, and content are required' 
      }, { status: 400 });
    }

    const { data: newPanel, error } = await supabase
      .from('landing_panels')
      .insert([{
        type,
        title,
        content,
        image_url,
        icon,
        button_text,
        button_url,
        stats: stats ? JSON.stringify(stats) : null,
        author,
        display_order,
        is_active: true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Panel management not yet available - database tables pending'
        }, { status: 503 });
      }
      console.error('Error creating panel:', error);
      return NextResponse.json({ error: 'Failed to create panel' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Panel created successfully',
      panel: newPanel
    });

  } catch (error) {
    console.error('Error creating panel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Admin only - update panel
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

    const { 
      id, 
      type, 
      title, 
      content, 
      image_url, 
      icon, 
      button_text, 
      button_url, 
      stats, 
      author, 
      display_order, 
      is_active 
    } = await request.json();

    if (!id) {
      return NextResponse.json({ 
        error: 'Panel ID is required' 
      }, { status: 400 });
    }

    const updates: any = {};
    if (type !== undefined) updates.type = type;
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (image_url !== undefined) updates.image_url = image_url;
    if (icon !== undefined) updates.icon = icon;
    if (button_text !== undefined) updates.button_text = button_text;
    if (button_url !== undefined) updates.button_url = button_url;
    if (stats !== undefined) updates.stats = JSON.stringify(stats);
    if (author !== undefined) updates.author = author;
    if (display_order !== undefined) updates.display_order = display_order;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data: updatedPanel, error } = await supabase
      .from('landing_panels')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Panel management not yet available'
        }, { status: 503 });
      }
      console.error('Error updating panel:', error);
      return NextResponse.json({ error: 'Failed to update panel' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Panel updated successfully',
      panel: updatedPanel
    });

  } catch (error) {
    console.error('Error updating panel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Admin only - delete panel
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
    const panelId = searchParams.get('id');

    if (!panelId) {
      return NextResponse.json({ 
        error: 'Panel ID is required' 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('landing_panels')
      .delete()
      .eq('id', panelId);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Panel management not yet available'
        }, { status: 503 });
      }
      console.error('Error deleting panel:', error);
      return NextResponse.json({ error: 'Failed to delete panel' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Panel deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting panel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
