import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "../../../../lib/supabase";

export async function DELETE(request: NextRequest) {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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
      .select('*, item:items(name)')
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
