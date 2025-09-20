import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "../../../../lib/auth-utils";
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Generate server seed (should be stored securely per user)
    const serverSeed = createHash('sha256')
      .update(`${session.user_id}-${Date.now()}-${Math.random()}`)
      .digest('hex');

    // Generate client seed (user can change this)
    const clientSeed = Math.random().toString(36).substr(2, 16);

    // Generate nonce (incremental counter per user)
    const nonce = 1;

    return NextResponse.json({
      success: true,
      seeds: {
        serverSeed: serverSeed,
        serverSeedHash: createHash('sha256').update(serverSeed).digest('hex'),
        clientSeed: clientSeed,
        nonce: nonce
      },
      message: "Provably fair seeds generated"
    });

  } catch (error) {
    console.error('Error generating provably fair seeds:', error);
    return NextResponse.json({ 
      error: "Failed to generate seeds" 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { clientSeed } = await request.json();
    
    if (!clientSeed || typeof clientSeed !== 'string') {
      return NextResponse.json({ error: "Valid client seed required" }, { status: 400 });
    }

    // Store client seed in database for provably fair gaming
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        client_seed: clientSeed,
        seed_updated_at: new Date().toISOString()
      })
      .eq('id', session.user_id);

    if (updateError) {
      console.error('Failed to update client seed:', updateError);
      return NextResponse.json({ 
        error: "Failed to update client seed" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      clientSeed: clientSeed,
      message: "Client seed updated successfully"
    });

  } catch (error) {
    console.error('Error updating client seed:', error);
    return NextResponse.json({ 
      error: "Failed to update client seed" 
    }, { status: 500 });
  }
}
