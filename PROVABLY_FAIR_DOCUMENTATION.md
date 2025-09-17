# Provably Fair RNG System Documentation

## Overview

This project implements a comprehensive provably fair random number generation (RNG) system using HMAC-SHA256 cryptography. The system ensures complete transparency and fairness for all games by allowing players to verify that game results were not manipulated.

## How Provably Fair Works

### 1. Server Seed Generation
- **Pre-commitment**: Server generates a random 256-bit seed before any games start
- **Hashing**: The seed is hashed with SHA-256 and the hash is publicly exposed
- **Secrecy**: The original seed remains secret until after the game is completed
- **Verification**: Players can verify the hash matches the revealed seed

### 2. Client Seed (Optional)
- **User Control**: Players can provide their own client seed
- **Random Generation**: If not provided, a random client seed is generated
- **Prevention**: Prevents server from pre-calculating results
- **Transparency**: Client seed is always visible to the player

### 3. Nonce System
- **Incrementing**: Each game increments a nonce counter
- **Uniqueness**: Ensures each game uses a unique combination
- **Order**: Maintains chronological order of games
- **Verification**: Nonce is included in all verification data

### 4. HMAC-SHA256 Generation
```
HMAC-SHA256(server_seed, "client_seed:nonce")
```
- **Cryptographic Security**: Uses industry-standard HMAC-SHA256
- **Deterministic**: Same inputs always produce same output
- **Verifiable**: Players can independently calculate the HMAC
- **Tamper-proof**: Cannot be manipulated without knowing the server seed

### 5. Result Generation
- **Hex to Decimal**: First 8 characters of HMAC converted to decimal
- **Normalization**: Divided by 0xffffffff to get 0-1 range
- **Game Logic**: Each game type uses this value differently
- **Transparency**: All calculations are publicly verifiable

## Supported Games

### 1. Plinko
**How it works:**
- Uses 16 random numbers from HMAC for each peg decision
- 0-0.5 = ball goes left, 0.5-1 = ball goes right
- Final position determines multiplier
- Path is completely verifiable

**Multiplier Calculation:**
```javascript
const multipliers = [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000];
const position = rightCount - leftCount;
const multiplier = multipliers[position + 8] || 0.2;
```

### 2. Crash
**How it works:**
- Single random number determines crash point
- House edge of ~1% built into calculation
- Exponential distribution with maximum multiplier
- Can crash immediately or reach high multipliers

**Crash Calculation:**
```javascript
function calculateCrashMultiplier(random) {
  const houseEdge = 0.01;
  if (random < houseEdge) return 1.0; // Immediate crash
  
  const multiplier = Math.max(1.0, Math.pow(1 - houseEdge, -random) - 1);
  return Math.min(multiplier, 1000); // Max 1000x
}
```

### 3. Coinflip
**How it works:**
- Single random number determines heads/tails
- 0-0.5 = heads, 0.5-1 = tails
- Simple 50/50 probability
- Easy to verify

### 4. Sweeper (Minesweeper)
**How it works:**
- Uses 100 random numbers for 10x10 grid
- 10% chance for each cell to be a mine
- Exactly 10 mines placed randomly
- Grid layout is verifiable

### 5. Crates
**How it works:**
- Single random number determines item rarity
- Weighted distribution for different rarities
- Item selection based on rarity
- Value calculation based on rarity

**Rarity Distribution:**
- Mythic: 0.1% (0.000-0.001)
- Legendary: 0.9% (0.001-0.010)
- Epic: 4% (0.010-0.050)
- Rare: 15% (0.050-0.200)
- Uncommon: 30% (0.200-0.500)
- Common: 50% (0.500-1.000)

## Database Schema

### Server Seeds Table
```sql
CREATE TABLE server_seeds (
    id TEXT PRIMARY KEY,
    seed TEXT NOT NULL,
    hashed_seed TEXT NOT NULL,
    is_revealed INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    revealed_at TEXT
);
```

### Client Seeds Table
```sql
CREATE TABLE client_seeds (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    seed TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### Game Results Table
```sql
CREATE TABLE game_results (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    game_type TEXT NOT NULL,
    server_seed_id TEXT NOT NULL,
    client_seed_id TEXT NOT NULL,
    nonce INTEGER NOT NULL,
    result TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (server_seed_id) REFERENCES server_seeds (id),
    FOREIGN KEY (client_seed_id) REFERENCES client_seeds (id)
);
```

## API Endpoints

### 1. Get Server Seed
```
GET /api/provably-fair/seeds
```
Returns the current server seed hash (pre-committed).

### 2. Generate New Server Seed (Admin)
```
POST /api/provably-fair/seeds
```
Generates a new server seed (admin only).

### 3. Play Game
```
POST /api/games/play
```
Plays a game using the provably fair system.

**Request Body:**
```json
{
  "gameType": "plinko|crash|coinflip|sweeper|crate",
  "gameId": "unique_game_id",
  "betAmount": 100,
  "customClientSeed": "optional_client_seed"
}
```

**Response:**
```json
{
  "success": true,
  "gameId": "game_id",
  "result": { /* game specific result */ },
  "winnings": 250,
  "isWin": true,
  "newBalance": 1250,
  "fairness": {
    "serverSeedId": "seed_id",
    "serverSeedHash": "hashed_seed",
    "clientSeed": "client_seed",
    "nonce": 1,
    "hmac": "hmac_sha256_result"
  }
}
```

### 4. Verify Game
```
POST /api/provably-fair/verify
```
Verifies a specific game result.

**Request Body:**
```json
{
  "gameId": "game_id_to_verify"
}
```

### 5. Get Game History
```
GET /api/provably-fair/verify?limit=50
```
Returns user's game history for verification.

## Verification Process

### Step 1: Get Game Data
1. Play a game and note the fairness data
2. Record the server seed hash, client seed, nonce, and HMAC

### Step 2: Wait for Seed Revelation
1. After the game, the server seed is revealed
2. Verify the revealed seed matches the published hash
3. Use SHA-256 to hash the revealed seed

### Step 3: Calculate HMAC
1. Use the formula: `HMAC-SHA256(server_seed, "client_seed:nonce")`
2. Compare with the HMAC provided in the game result
3. They should match exactly

### Step 4: Verify Game Result
1. Convert the first 8 characters of HMAC to decimal
2. Divide by 0xffffffff to get a 0-1 value
3. Apply the game-specific logic to determine the result
4. Compare with the actual game result

### Example Verification (Plinko)
```javascript
// Given data from game
const serverSeed = "abc123...";
const clientSeed = "def456...";
const nonce = 1;
const hmac = "a1b2c3d4e5f6...";

// Calculate HMAC
const calculatedHmac = crypto.createHmac('sha256', serverSeed)
  .update(`${clientSeed}:${nonce}`)
  .digest('hex');

// Verify HMAC matches
console.log(calculatedHmac === hmac); // Should be true

// Generate random numbers for path
const randomNumbers = [];
for (let i = 0; i < 16; i++) {
  const hex = hmac.substring(i * 8, (i + 1) * 8);
  const decimal = parseInt(hex, 16) / 0xffffffff;
  randomNumbers.push(decimal);
}

// Verify path
const path = randomNumbers.map(r => r < 0.5 ? 0 : 1);
console.log(path); // Should match the game result path
```

## Security Features

### 1. Pre-commitment Scheme
- Server seeds are hashed and published before games
- Server cannot change the seed after seeing the result
- Complete transparency in seed generation

### 2. Client Seed Protection
- Players can provide their own client seeds
- Prevents server from pre-calculating results
- Adds additional layer of randomness

### 3. Nonce System
- Each game uses a unique nonce
- Prevents replay attacks
- Maintains chronological order

### 4. Cryptographic Security
- HMAC-SHA256 is cryptographically secure
- Cannot be reverse-engineered
- Industry-standard algorithm

### 5. Database Integrity
- All game results are permanently stored
- Complete audit trail
- Immutable game history

## Testing

### Test Page
Visit `/test-provably-fair` to:
- Test Plinko and Crash games
- View server seed information
- Verify game results
- Learn about the system

### Manual Testing
1. Play multiple games
2. Record the fairness data
3. Verify each game manually
4. Check that results are consistent

### Automated Testing
```javascript
// Example test case
const testGame = async () => {
  const response = await fetch('/api/games/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameType: 'plinko',
      gameId: 'test_game',
      betAmount: 10
    })
  });
  
  const result = await response.json();
  
  // Verify the game
  const verifyResponse = await fetch('/api/provably-fair/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId: result.gameId })
  });
  
  const verification = await verifyResponse.json();
  console.log('Game verified:', verification.verification.isValid);
};
```

## Best Practices

### 1. Seed Management
- Generate new server seeds regularly
- Keep old seeds for verification
- Monitor seed usage and rotation

### 2. Client Seed Handling
- Allow players to set custom client seeds
- Provide random generation as fallback
- Store client seeds securely

### 3. Verification Tools
- Provide easy-to-use verification tools
- Include step-by-step instructions
- Offer online calculators

### 4. Transparency
- Display server seed hashes prominently
- Show verification data for each game
- Provide clear documentation

### 5. Security
- Use secure random number generation
- Protect against timing attacks
- Implement rate limiting

## Compliance

### 1. Gaming Regulations
- Meets requirements for fair gaming
- Provides audit trail for regulators
- Transparent and verifiable system

### 2. Player Protection
- Prevents manipulation by operators
- Allows independent verification
- Builds trust and confidence

### 3. Legal Requirements
- Complies with gambling regulations
- Provides necessary documentation
- Meets fairness standards

## Future Enhancements

### 1. Advanced Features
- Multi-signature seed generation
- Decentralized verification
- Blockchain integration

### 2. Additional Games
- More game types
- Custom game mechanics
- Tournament systems

### 3. Analytics
- Fairness statistics
- Player verification rates
- System performance metrics

### 4. Mobile Support
- Mobile verification tools
- Offline verification
- QR code integration

This provably fair system ensures complete transparency and fairness for all players while maintaining the security and integrity of the gaming platform.
