import { NextRequest, NextResponse } from 'next/server'import { NextRequest, NextResponse } from 'next/server'

import { createServerSupabaseClient } from '@/lib/supabase'import { createServerSupabaseClient } from '@/lib/supabase'



export async function GET(request: NextRequest) {export async function GET(request: NextRequest) {

  try {  try {

    const supabase = createServerSupabaseClient()    const supabase = createServerSupabaseClient()

        

    // Get user from session    // Get user from session

    const { data: { user }, error: authError } = await supabase.auth.getUser()    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {    if (authError || !user) {

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    }    }



    // Get all active missions    // Get all active missions

    const { data: missions, error: missionsError } = await supabase    const { data: missions, error: missionsError } = await supabase

      .from('missions')      .from('missions')

      .select('*')      .select('*')

      .eq('is_active', true)      .eq('is_active', true)

      .order('created_at', { ascending: false })      .order('created_at', { ascending: false })



    if (missionsError) {    if (missionsError) {

      console.error('Missions error:', missionsError)      console.error('Missions error:', missionsError)

      return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 })      return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 })

    }    }



    return NextResponse.json({     return NextResponse.json({ 

      success: true,      success: true,

      missions: missions || [],      missions: missions || [],

      total: missions?.length || 0      total: missions?.length || 0

    })    })



  } catch (error) {  } catch (error) {

    console.error('Missions API error:', error)    console.error('Missions API error:', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })

  }  }

}}