import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // No authentication required for viewing perks - anyone can browse the shop
    // Get perks from database
    const { data: perks, error: perksError } = await supabase
      .from('perks')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('coin_price', { ascending: true })

    if (perksError) {
      console.error('Perks error:', perksError)
      return NextResponse.json({ error: 'Failed to fetch perks' }, { status: 500 })
    }

    // For public viewing, just return perks without ownership status
    // Ownership can be checked when user is authenticated for purchases
    const perksWithBasicInfo = perks.map(perk => ({
      ...perk,
      owned: false // Default to false for public viewing
    }))

    return NextResponse.json({ 
      perks: perksWithBasicInfo,
      user_perks: [],
      total: perks.length 
    })

  } catch (error) {
    console.error('Perks API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}