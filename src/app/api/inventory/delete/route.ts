import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('equipgg_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const session = JSON.parse(decodeURIComponent(sessionCookie.value));
    const userId = session.user_id;
    const supabase = createServerSupabaseClient();

    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }
    
    // Check if item exists and belongs to user
    const { data: inventoryItem, error: findError } = await supabase
      .from('user_inventory')
      .select('*, item:items!fk_user_inventory_item_id(name)')
      .eq('id', itemId)
      .eq('user_id', session.user.id)
      .single();

    if (findError || !inventoryItem) {
      console.error('Error finding inventory item:', findError);
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Delete the item
    const { error: deleteError } = await supabase
      .from('user_inventory')
      .delete()
      .eq('id', itemId)
      .eq('user_id', session.user.id);

    if (deleteError) {
      console.error('Error deleting inventory item:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${inventoryItem.item.name} deleted successfully`,
      deletedItemId: itemId
    });

  } catch (error) {
    console.error('Delete item error:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
