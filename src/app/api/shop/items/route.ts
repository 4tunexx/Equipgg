import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get items with featured status
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('is_active', true)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (itemsError) {
      console.error('Items error:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    // Get perks
    const { data: perks, error: perksError } = await supabase
      .from('perks')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (perksError) {
      console.error('Perks error:', perksError)
    }

    return NextResponse.json({ 
      items: items || [],
      perks: perks || [],
      total_items: items?.length || 0,
      total_perks: perks?.length || 0
    })

  } catch (error) {
    console.error('Shop items API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}