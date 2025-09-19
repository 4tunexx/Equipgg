import { NextRequest, NextResponse } from 'next/server';
import { io } from 'socket.io-client';

// Connect to our Socket.IO server
const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling']
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userId, ...data } = body;

    if (!type || !userId) {
      return NextResponse.json({ error: 'Type and userId are required' }, { status: 400 });
    }

    // Wait for socket connection
    if (!socket.connected) {
      await new Promise<void>((resolve) => {
        socket.on('connect', () => resolve());
        socket.connect();
      });
    }

    switch (type) {
      case 'xp-gain':
        {
          const { amount = 100, source = 'test', newLevel, leveledUp = false } = data;
          socket.emit('xp-gained', {
            userId,
            amount,
            source,
            newLevel,
            leveledUp
          });
          return NextResponse.json({
            success: true,
            message: `XP gain triggered: ${amount} XP from ${source}${leveledUp ? ` - Level up to ${newLevel}!` : ''}`
          });
        }

      case 'level-up':
        {
          const { newLevel = 2 } = data;
          socket.emit('xp-gained', {
            userId,
            amount: 100,
            source: 'level-up-test',
            newLevel,
            leveledUp: true
          });
          return NextResponse.json({
            success: true,
            message: `Level up triggered: New level ${newLevel}!`
          });
        }

      case 'balance-update':
        {
          const { coins = 1000, gems = 500, xp = 1500, level = 3 } = data;
          socket.emit('balance-updated', {
            userId,
            coins,
            gems,
            xp,
            level
          });
          return NextResponse.json({
            success: true,
            message: `Balance update triggered: ${coins} coins, ${gems} gems, ${xp} XP, level ${level}`
          });
        }

      case 'game-win':
        {
          const { game = 'crash', amount = 500, multiplier = 2.5 } = data;
          socket.emit('game-result', {
            userId,
            game,
            won: true,
            amount,
            multiplier
          });
          return NextResponse.json({
            success: true,
            message: `Game win triggered: Won ${amount} in ${game} with ${multiplier}x multiplier!`
          });
        }

      case 'confetti':
        {
          const { confettiType = 'win', amount = 1000, source = 'test' } = data;
          socket.emit('confetti', {
            type: confettiType,
            amount,
            source,
            timestamp: Date.now()
          });
          return NextResponse.json({
            success: true,
            message: `Confetti triggered: ${confettiType} confetti for ${amount} from ${source}`
          });
        }

      case 'achievement':
        {
          const { 
            achievementId = 'test-achievement',
            title = 'Test Achievement',
            description = 'You unlocked a test achievement!',
            reward = '100 coins'
          } = data;
          socket.emit('achievement-unlocked', {
            userId,
            achievementId,
            title,
            description,
            reward
          });
          return NextResponse.json({
            success: true,
            message: `Achievement unlocked: ${title} - ${reward}`
          });
        }

      case 'mission-complete':
        {
          const { missionId = 'daily-login', reward = '50 XP + 25 coins' } = data;
          socket.emit('mission-completed', {
            userId,
            missionId,
            reward
          });
          return NextResponse.json({
            success: true,
            message: `Mission completed: ${missionId} - Reward: ${reward}`
          });
        }

      case 'bet-win':
        {
          const { 
            betId = 'test-bet-123',
            matchId = 'test-match-456',
            amount = 100,
            winnings = 250
          } = data;
          socket.emit('bet-result', {
            betId,
            userId,
            matchId,
            won: true,
            amount,
            winnings
          });
          return NextResponse.json({
            success: true,
            message: `Bet win triggered: Won ${winnings} from ${amount} bet on match ${matchId}`
          });
        }

      default:
        return NextResponse.json({ error: 'Unknown notification type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Socket notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const examples = {
    xp_gain: 'POST /api/test-socket with { "type": "xp-gain", "userId": "user-id", "amount": 150, "source": "daily-bonus" }',
    level_up: 'POST /api/test-socket with { "type": "level-up", "userId": "user-id", "newLevel": 5 }',
    balance_update: 'POST /api/test-socket with { "type": "balance-update", "userId": "user-id", "coins": 2000, "gems": 750 }',
    game_win: 'POST /api/test-socket with { "type": "game-win", "userId": "user-id", "game": "coinflip", "amount": 500, "multiplier": 2.0 }',
    confetti: 'POST /api/test-socket with { "type": "confetti", "userId": "user-id", "confettiType": "achievement" }',
    achievement: 'POST /api/test-socket with { "type": "achievement", "userId": "user-id", "title": "First Win!", "reward": "200 coins" }',
    mission_complete: 'POST /api/test-socket with { "type": "mission-complete", "userId": "user-id", "missionId": "first-bet", "reward": "100 XP" }',
    bet_win: 'POST /api/test-socket with { "type": "bet-win", "userId": "user-id", "amount": 100, "winnings": 300 }'
  };

  return NextResponse.json({
    message: 'Socket.IO Real-time Features Test Endpoint',
    socket_server: 'http://localhost:3001',
    status: socket.connected ? 'Connected' : 'Disconnected',
    examples
  });
}