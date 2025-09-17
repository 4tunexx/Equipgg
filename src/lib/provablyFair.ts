import crypto from 'crypto';
import { getDb, getOne, run, getAll } from '@/lib/db';

// Types for provably fair system
export interface ServerSeed {
  id: string;
  seed: string;
  hashedSeed: string;
  isRevealed: boolean;
  createdAt: string;
  revealedAt?: string;
}

export interface ClientSeed {
  id: string;
  userId: string;
  seed: string;
  createdAt: string;
}

export interface GameResult {
  gameId: string;
  gameType: 'plinko' | 'crash' | 'coinflip' | 'sweeper' | 'crate';
  serverSeedId: string;
  clientSeedId: string;
  nonce: number;
  result: any;
  createdAt: string;
}

export interface VerificationData {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  result: any;
  gameType: string;
  gameId: string;
}

// Generate a new server seed
export async function generateServerSeed(): Promise<ServerSeed> {
  const seed = crypto.randomBytes(32).toString('hex');
  const hashedSeed = crypto.createHash('sha256').update(seed).digest('hex');
  
  const serverSeed: ServerSeed = {
    id: `seed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    seed,
    hashedSeed,
    isRevealed: false,
    createdAt: new Date().toISOString()
  };

  const db = await getDb();
  await run(
    `INSERT INTO server_seeds (id, seed, hashed_seed, is_revealed, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [serverSeed.id, serverSeed.seed, serverSeed.hashedSeed, 0, serverSeed.createdAt]
  );

  return serverSeed;
}

// Get or create client seed for user
export async function getOrCreateClientSeed(userId: string): Promise<ClientSeed> {
  const db = await getDb();
  
  // Check if user has an active client seed
  let clientSeed = await getOne<ClientSeed>(
    'SELECT * FROM client_seeds WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [userId]
  );

  if (!clientSeed) {
    // Create new client seed
    const seed = crypto.randomBytes(16).toString('hex');
    clientSeed = {
      id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      seed,
      createdAt: new Date().toISOString()
    };

    await run(
      `INSERT INTO client_seeds (id, user_id, seed, created_at)
       VALUES (?, ?, ?, ?)`,
      [clientSeed.id, clientSeed.userId, clientSeed.seed, clientSeed.createdAt]
    );
  }

  return clientSeed;
}

// Generate HMAC-SHA256 hash for provably fair randomness
export function generateHMAC(serverSeed: string, clientSeed: string, nonce: number): string {
  const message = `${clientSeed}:${nonce}`;
  return crypto.createHmac('sha256', serverSeed).update(message).digest('hex');
}

// Convert hex to decimal (0-1 range)
export function hexToDecimal(hex: string): number {
  const decimal = parseInt(hex.substring(0, 8), 16);
  return decimal / 0xffffffff;
}

// Generate multiple random numbers from a single HMAC
export function generateRandomNumbers(hmac: string, count: number): number[] {
  const numbers: number[] = [];
  for (let i = 0; i < count; i++) {
    const start = i * 8;
    const end = start + 8;
    const hex = hmac.substring(start, end);
    numbers.push(hexToDecimal(hex));
  }
  return numbers;
}

// Get next nonce for user
export async function getNextNonce(userId: string): Promise<number> {
  const db = await getDb();
  const result = await getOne<{ maxNonce: number }>(
    'SELECT MAX(nonce) as maxNonce FROM game_results WHERE user_id = ?',
    [userId]
  );
  return (result?.maxNonce || 0) + 1;
}

// Record game result for verification
export async function recordGameResult(
  userId: string,
  gameId: string,
  gameType: 'plinko' | 'crash' | 'coinflip' | 'sweeper' | 'crate',
  serverSeedId: string,
  clientSeedId: string,
  nonce: number,
  result: any
): Promise<void> {
  const db = await getDb();
  await run(
    `INSERT INTO game_results (id, user_id, game_id, game_type, server_seed_id, client_seed_id, nonce, result, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      gameId,
      gameType,
      serverSeedId,
      clientSeedId,
      nonce,
      JSON.stringify(result),
      new Date().toISOString()
    ]
  );
}

// Get active server seed (not yet revealed)
export async function getActiveServerSeed(): Promise<ServerSeed | null> {
  const db = await getDb();
  return await getOne<ServerSeed>(
    'SELECT * FROM server_seeds WHERE is_revealed = 0 ORDER BY created_at DESC LIMIT 1'
  );
}

// Reveal server seed
export async function revealServerSeed(seedId: string): Promise<ServerSeed | null> {
  const db = await getDb();
  
  // Get the seed
  const seed = await getOne<ServerSeed>(
    'SELECT * FROM server_seeds WHERE id = ?',
    [seedId]
  );

  if (!seed) {
    return null;
  }

  // Mark as revealed
  await run(
    'UPDATE server_seeds SET is_revealed = 1, revealed_at = ? WHERE id = ?',
    [new Date().toISOString(), seedId]
  );

  // Generate new server seed for future games
  await generateServerSeed();

  return {
    ...seed,
    isRevealed: true,
    revealedAt: new Date().toISOString()
  };
}

// Verify game result
export function verifyGameResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  gameType: string,
  result: any
): boolean {
  const hmac = generateHMAC(serverSeed, clientSeed, nonce);
  
  switch (gameType) {
    case 'plinko':
      return verifyPlinkoResult(hmac, result);
    case 'crash':
      return verifyCrashResult(hmac, result);
    case 'coinflip':
      return verifyCoinflipResult(hmac, result);
    case 'sweeper':
      return verifySweeperResult(hmac, result);
    case 'crate':
      return verifyCrateResult(hmac, result);
    default:
      return false;
  }
}

// Game-specific verification functions
function verifyPlinkoResult(hmac: string, result: any): boolean {
  const randomNumbers = generateRandomNumbers(hmac, 16); // 16 pegs
  const path = result.path;
  
  if (!path || path.length !== 16) {
    return false;
  }

  // Verify each peg decision
  for (let i = 0; i < 16; i++) {
    const shouldGoLeft = randomNumbers[i] < 0.5;
    const actualDirection = path[i] === 0; // 0 = left, 1 = right
    
    if (shouldGoLeft !== actualDirection) {
      return false;
    }
  }

  return true;
}

function verifyCrashResult(hmac: string, result: any): boolean {
  const randomNumbers = generateRandomNumbers(hmac, 1);
  const expectedMultiplier = calculateCrashMultiplier(randomNumbers[0]);
  
  return Math.abs(result.multiplier - expectedMultiplier) < 0.001;
}

function verifyCoinflipResult(hmac: string, result: any): boolean {
  const randomNumbers = generateRandomNumbers(hmac, 1);
  const expectedResult = randomNumbers[0] < 0.5 ? 'heads' : 'tails';
  
  return result.result === expectedResult;
}

function verifySweeperResult(hmac: string, result: any): boolean {
  const randomNumbers = generateRandomNumbers(hmac, 100); // 10x10 grid
  const mines = result.mines;
  
  if (!mines || mines.length !== 10) {
    return false;
  }

  // Verify mine positions
  const expectedMines: number[] = [];
  for (let i = 0; i < 100; i++) {
    if (randomNumbers[i] < 0.1) { // 10% chance for mine
      expectedMines.push(i);
    }
  }

  // Check if we have exactly 10 mines and they match
  if (expectedMines.length !== 10) {
    return false;
  }

  return JSON.stringify(mines.sort()) === JSON.stringify(expectedMines.sort());
}

function verifyCrateResult(hmac: string, result: any): boolean {
  const randomNumbers = generateRandomNumbers(hmac, 1);
  const expectedRarity = calculateCrateRarity(randomNumbers[0]);
  
  return result.rarity === expectedRarity;
}

// Game-specific result generation functions
export function generatePlinkoResult(hmac: string): { path: number[]; multiplier: number } {
  const randomNumbers = generateRandomNumbers(hmac, 16);
  const path: number[] = [];
  
  // Generate path (0 = left, 1 = right)
  for (let i = 0; i < 16; i++) {
    path.push(randomNumbers[i] < 0.5 ? 0 : 1);
  }

  // Calculate final position and multiplier
  const leftCount = path.filter(p => p === 0).length;
  const rightCount = 16 - leftCount;
  const position = rightCount - leftCount;
  
  // Plinko multiplier based on position
  const multipliers = [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000];
  const multiplier = multipliers[position + 8] || 0.2;

  return { path, multiplier };
}

export function generateCrashResult(hmac: string): { multiplier: number; crashed: boolean } {
  const randomNumbers = generateRandomNumbers(hmac, 1);
  const multiplier = calculateCrashMultiplier(randomNumbers[0]);
  
  return {
    multiplier,
    crashed: multiplier < 1.01
  };
}

export function generateCoinflipResult(hmac: string): { result: 'heads' | 'tails' } {
  const randomNumbers = generateRandomNumbers(hmac, 1);
  
  return {
    result: randomNumbers[0] < 0.5 ? 'heads' : 'tails'
  };
}

export function generateSweeperResult(hmac: string): { mines: number[]; grid: boolean[][] } {
  const randomNumbers = generateRandomNumbers(hmac, 100);
  const mines: number[] = [];
  const grid: boolean[][] = Array(10).fill(null).map(() => Array(10).fill(false));
  
  // Place 10 mines randomly
  for (let i = 0; i < 100; i++) {
    if (randomNumbers[i] < 0.1 && mines.length < 10) {
      mines.push(i);
      const row = Math.floor(i / 10);
      const col = i % 10;
      grid[row][col] = true;
    }
  }

  // If we don't have exactly 10 mines, fill remaining spots
  while (mines.length < 10) {
    const randomIndex = Math.floor(Math.random() * 100);
    if (!mines.includes(randomIndex)) {
      mines.push(randomIndex);
      const row = Math.floor(randomIndex / 10);
      const col = randomIndex % 10;
      grid[row][col] = true;
    }
  }

  return { mines, grid };
}

export function generateCrateResult(hmac: string): { rarity: string; item: any } {
  const randomNumbers = generateRandomNumbers(hmac, 1);
  const rarity = calculateCrateRarity(randomNumbers[0]);
  
  // This would be expanded with actual item selection logic
  const item = {
    id: `item_${Date.now()}`,
    name: `Random ${rarity} Item`,
    rarity,
    value: getRarityValue(rarity)
  };

  return { rarity, item };
}

// Helper functions for game mechanics
function calculateCrashMultiplier(random: number): number {
  // Crash multiplier calculation (house edge ~1%)
  const houseEdge = 0.01;
  const maxMultiplier = 1000;
  
  if (random < houseEdge) {
    return 1.0; // Crash immediately
  }
  
  // Exponential distribution with house edge
  const multiplier = Math.max(1.0, Math.pow(1 - houseEdge, -random) - 1);
  return Math.min(multiplier, maxMultiplier);
}

function calculateCrateRarity(random: number): string {
  // Rarity distribution
  if (random < 0.001) return 'Mythic';      // 0.1%
  if (random < 0.01) return 'Legendary';    // 0.9%
  if (random < 0.05) return 'Epic';         // 4%
  if (random < 0.2) return 'Rare';          // 15%
  if (random < 0.5) return 'Uncommon';      // 30%
  return 'Common';                          // 50%
}

function getRarityValue(rarity: string): number {
  const values = {
    'Common': 10,
    'Uncommon': 50,
    'Rare': 200,
    'Epic': 1000,
    'Legendary': 5000,
    'Mythic': 25000
  };
  return values[rarity as keyof typeof values] || 10;
}

// Get user's game history for verification
export async function getUserGameHistory(userId: string, limit: number = 50): Promise<GameResult[]> {
  const db = await getDb();
  const results = await getAll<GameResult>(
    `SELECT gr.*, ss.seed as server_seed, cs.seed as client_seed
     FROM game_results gr
     JOIN server_seeds ss ON gr.server_seed_id = ss.id
     JOIN client_seeds cs ON gr.client_seed_id = cs.id
     WHERE gr.user_id = ?
     ORDER BY gr.created_at DESC
     LIMIT ?`,
    [userId, limit]
  );

  return results.map(result => ({
    ...result,
    result: JSON.parse(result.result as any)
  }));
}

// Get verification data for a specific game
export async function getGameVerificationData(gameId: string): Promise<VerificationData | null> {
  const db = await getDb();
  const result = await getOne<{
    server_seed: string;
    client_seed: string;
    nonce: number;
    result: string;
    game_type: string;
    game_id: string;
  }>(
    `SELECT gr.nonce, gr.result, gr.game_type, gr.game_id, ss.seed as server_seed, cs.seed as client_seed
     FROM game_results gr
     JOIN server_seeds ss ON gr.server_seed_id = ss.id
     JOIN client_seeds cs ON gr.client_seed_id = cs.id
     WHERE gr.game_id = ?`,
    [gameId]
  );

  if (!result) {
    return null;
  }

  return {
    serverSeed: result.server_seed,
    clientSeed: result.client_seed,
    nonce: result.nonce,
    result: JSON.parse(result.result),
    gameType: result.game_type,
    gameId: result.game_id
  };
}
