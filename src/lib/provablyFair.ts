import { createHash } from 'crypto';
import { supabase } from './supabase';

// Generate a cryptographically secure seed
export async function generateSeed(): Promise<string> {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Node.js environment
    const crypto = await import('crypto');
    crypto.randomFillSync(array);
  }
  return Buffer.from(array).toString('hex');
}

export function verifySeed(serverSeed: string, clientSeed: string, nonce: number, result: unknown): boolean {
  try {
    const expectedHash = hashCombined(serverSeed, clientSeed, nonce);
    const resultHash = typeof result === 'object' ? JSON.stringify(result) : String(result);
    return expectedHash === resultHash;
  } catch (error) {
    console.error('Seed verification error:', error);
    return false;
  }
}

export function hashSeed(seed: string): string {
  return createHash('sha256').update(seed).digest('hex');
}

export function hashCombined(serverSeed: string, clientSeed: string, nonce: number): string {
  const combined = `${serverSeed}:${clientSeed}:${nonce}`;
  return createHash('sha256').update(combined).digest('hex');
}

export async function getActiveServerSeed(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('server_seeds')
      .select('seed_hash')
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      // Create new server seed if none exists
      const newSeed = await generateSeed();
      const { error: insertError } = await supabase
        .from('server_seeds')
        .insert({
          seed_hash: hashSeed(newSeed),
          is_active: true,
          created_at: new Date().toISOString()
        });
      
      if (insertError) throw insertError;
      return hashSeed(newSeed);
    }
    
    return data.seed_hash;
  } catch (error) {
    console.error('Error getting server seed:', error);
    return hashSeed(await generateSeed());
  }
}

export async function getOrCreateClientSeed(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('client_seeds')
      .select('seed')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      // Create new client seed
      const newSeed = await generateSeed();
      const { error: insertError } = await supabase
        .from('client_seeds')
        .insert({
          user_id: userId,
          seed: newSeed,
          is_active: true,
          created_at: new Date().toISOString()
        });
      
      if (insertError) throw insertError;
      return newSeed;
    }
    
    return data.seed;
  } catch (error) {
    console.error('Error getting client seed:', error);
    return await generateSeed();
  }
}

export async function getNextNonce(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('game_results')
      .select('nonce')
      .eq('user_id', userId)
      .order('nonce', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return 1;
    }
    
    return (data.nonce || 0) + 1;
  } catch (error) {
    console.error('Error getting next nonce:', error);
    return 1;
  }
}

export async function getGameVerificationData(gameId: string): Promise<unknown> {
  try {
    const { data, error } = await supabase
      .from('game_results')
      .select('game_id, user_id, server_seed_hash, client_seed, nonce, result, created_at')
      .eq('game_id', gameId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      gameId: data.game_id,
      userId: data.user_id,
      serverSeedHash: data.server_seed_hash,
      clientSeed: data.client_seed,
      nonce: data.nonce,
      result: data.result,
      timestamp: data.created_at
    };
  } catch (error) {
    console.error('Error getting game verification data:', error);
    return null;
  }
}

export async function verifyGameResult(gameId: string, serverSeed: string): Promise<boolean> {
  try {
    const gameData = await getGameVerificationData(gameId);
    if (!gameData) return false;
    
    return verifySeed(serverSeed, gameData.clientSeed, gameData.nonce, gameData.result);
  } catch (error) {
    console.error('Error verifying game result:', error);
    return false;
  }
}

export async function getUserGameHistory(userId: string, limit: number = 50): Promise<unknown[]> {
  try {
    const { data, error } = await supabase
      .from('game_results')
      .select('game_id, game_type, server_seed_hash, client_seed, nonce, result, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting user game history:', error);
    return [];
  }
}
