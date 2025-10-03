import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Get user's current perks
    const { data: userPerks, error: userPerksError } = await supabase
      .from('user_perks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (userPerksError) {
      console.error('User perks error:', userPerksError)
    }

    // Add ownership status to perks
    const perksWithOwnership = perks.map(perk => ({
      ...perk,
      owned: userPerks?.some(up => up.perk_id === perk.id.toString()) || false
    }))

    return NextResponse.json({ 
      perks: perksWithOwnership,
      user_perks: userPerks || [],
      total: perks.length 
    })

  } catch (error) {
    console.error('Perks API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}