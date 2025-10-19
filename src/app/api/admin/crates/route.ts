import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from "../../../../lib/auth-utils";
import { supabase } from "../../../../lib/supabase/client";
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin' && session.role !== 'moderator') {
      return createForbiddenResponse('You do not have permission to access admin functions.');
    }

    // Fetch crates with their items
    const { data: crates, error } = await supabase
      .from('crates')
      .select(`
        *,
        items:crate_items(
          item_id,
          drop_chance,
          item:items(*)
        )
      `);

    if (error) {
      console.error('Error fetching admin crates:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      crates
    });

  } catch (error) {
    console.error('Error fetching admin crates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin') {
      return createForbiddenResponse('Only admins can create crates.');
    }

    const { name, description, image, contents, isActive, xp_reward, coin_reward, gem_reward, selectedItems, itemOdds } = await request.json();

    if (!name || !description) {
      return NextResponse.json({ error: 'Required fields missing (Name and Description)' }, { status: 400 });
    }

    const newCrate = {
      id: uuidv4(),
      name,
      description,
      image_url: image || null,
      contents: Array.isArray(contents) ? contents : [],
      is_active: isActive !== false,
      xp_reward: xp_reward || 0,
      coin_reward: coin_reward || 0,
      gem_reward: gem_reward || 0,
    };

    const { data, error } = await supabase
      .from('crates')
      .insert(newCrate)
      .select()
      .single();

    if (error) {
      console.error('Error creating crate:', error);
      return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }

    // Save selected items and drop rates to crate_items table
    if (selectedItems && Array.isArray(selectedItems) && selectedItems.length > 0) {
      const crateItemsToInsert = selectedItems.map((itemId: number) => ({
        crate_id: data.id,
        item_id: itemId,
        drop_chance: (itemOdds && itemOdds[itemId]) ? itemOdds[itemId] / 100 : 0.1
      }));

      const { error: itemsError } = await supabase
        .from('crate_items')
        .insert(crateItemsToInsert);

      if (itemsError) {
        console.error('Error saving crate items:', itemsError);
        // Don't fail the whole operation, just log it
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Crate created successfully',
      crate: data
    });

  } catch (error) {
    console.error('Error creating crate:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin') {
      return createForbiddenResponse('Only admins can update crates.');
    }

    const { id, name, description, image, contents, isActive, xp_reward, coin_reward, gem_reward, selectedItems, itemOdds } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Crate ID is required' }, { status: 400 });
    }

    const updateData: any = {
      name,
      description,
      image_url: image,
      contents,
      is_active: isActive,
      xp_reward: xp_reward || 0,
      coin_reward: coin_reward || 0,
      gem_reward: gem_reward || 0,
    };

    const { data, error } = await supabase
      .from('crates')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating crate:', error);
      return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }

    // Update crate_items: delete old ones and insert new ones
    if (selectedItems !== undefined && Array.isArray(selectedItems)) {
      // Delete existing crate items
      await supabase
        .from('crate_items')
        .delete()
        .eq('crate_id', id);

      // Insert new crate items
      if (selectedItems.length > 0) {
        const crateItemsToInsert = selectedItems.map((itemId: number) => ({
          crate_id: id,
          item_id: itemId,
          drop_chance: (itemOdds && itemOdds[itemId]) ? itemOdds[itemId] / 100 : 0.1
        }));

        const { error: itemsError } = await supabase
          .from('crate_items')
          .insert(crateItemsToInsert);

        if (itemsError) {
          console.error('Error updating crate items:', itemsError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Crate updated successfully'
    });

  } catch (error) {
    console.error('Error updating crate:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin') {
      return createForbiddenResponse('Only admins can delete crates.');
    }

    const { searchParams } = new URL(request.url);
    const crateId = searchParams.get('id');

    if (!crateId) {
      return NextResponse.json({ error: 'Crate ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('crates')
      .delete()
      .eq('id', crateId);

    if (error) {
      console.error('Error deleting crate:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Crate deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting crate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
