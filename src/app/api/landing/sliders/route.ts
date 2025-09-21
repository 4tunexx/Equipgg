import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

// Landing page sliders/banners management
export async function GET(request: NextRequest) {
  try {
    // Get active sliders
    const { data: sliders, error } = await supabase
      .from('landing_sliders')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching sliders:', error);
      return NextResponse.json({ error: 'Failed to fetch sliders' }, { status: 500 });
    }

    // If table doesn't exist, return default sliders
    if (error && error.code === 'PGRST116') {
      const defaultSliders = [
        {
          id: '1',
          title: 'Welcome to EquipGG',
          subtitle: 'The ultimate CS2 gambling platform',
          image_url: '/bg2.png',
          button_text: 'Start Playing',
          button_url: '/dashboard/arcade',
          is_active: true,
          display_order: 1
        },
        {
          id: '2',
          title: 'Win Big with Crash',
          subtitle: 'Cash out before the crash for massive multipliers',
          image_url: '/1.png',
          button_text: 'Play Crash',
          button_url: '/dashboard/arcade?game=crash',
          is_active: true,
          display_order: 2
        },
        {
          id: '3',
          title: 'Coinflip Battles',
          subtitle: 'Double or nothing in intense 1v1 battles',
          image_url: '/2.png',
          button_text: 'Try Coinflip',
          button_url: '/dashboard/arcade?game=coinflip',
          is_active: true,
          display_order: 3
        }
      ];

      return NextResponse.json({
        success: true,
        sliders: defaultSliders
      });
    }

    return NextResponse.json({
      success: true,
      sliders: sliders || []
    });

  } catch (error) {
    console.error('Error in sliders GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin only - create new slider
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

    const { title, subtitle, image_url, button_text, button_url, display_order = 999 } = await request.json();

    if (!title || !image_url) {
      return NextResponse.json({ 
        error: 'Title and image URL are required' 
      }, { status: 400 });
    }

    const { data: newSlider, error } = await supabase
      .from('landing_sliders')
      .insert([{
        title,
        subtitle,
        image_url,
        button_text,
        button_url,
        display_order,
        is_active: true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Slider management not yet available - database tables pending'
        }, { status: 503 });
      }
      console.error('Error creating slider:', error);
      return NextResponse.json({ error: 'Failed to create slider' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Slider created successfully',
      slider: newSlider
    });

  } catch (error) {
    console.error('Error creating slider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Admin only - update slider
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

    const { id, title, subtitle, image_url, button_text, button_url, display_order, is_active } = await request.json();

    if (!id) {
      return NextResponse.json({ 
        error: 'Slider ID is required' 
      }, { status: 400 });
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (subtitle !== undefined) updates.subtitle = subtitle;
    if (image_url !== undefined) updates.image_url = image_url;
    if (button_text !== undefined) updates.button_text = button_text;
    if (button_url !== undefined) updates.button_url = button_url;
    if (display_order !== undefined) updates.display_order = display_order;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data: updatedSlider, error } = await supabase
      .from('landing_sliders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Slider management not yet available'
        }, { status: 503 });
      }
      console.error('Error updating slider:', error);
      return NextResponse.json({ error: 'Failed to update slider' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Slider updated successfully',
      slider: updatedSlider
    });

  } catch (error) {
    console.error('Error updating slider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Admin only - delete slider
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
    const sliderId = searchParams.get('id');

    if (!sliderId) {
      return NextResponse.json({ 
        error: 'Slider ID is required' 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('landing_sliders')
      .delete()
      .eq('id', sliderId);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Slider management not yet available'
        }, { status: 503 });
      }
      console.error('Error deleting slider:', error);
      return NextResponse.json({ error: 'Failed to delete slider' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Slider deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting slider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
