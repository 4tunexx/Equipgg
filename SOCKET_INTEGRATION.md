# Socket.IO Integration Documentation

## Overview

This project now includes a comprehensive Socket.IO integration with modular event channels for real-time features. The system is designed to be scalable, maintainable, and provides fallback mechanisms for disconnected clients.

## Architecture

### Modular Structure

The Socket.IO integration is organized into separate modules in the `/src/sockets/` directory:

```
src/sockets/
├── index.ts           # Main socket handler setup
├── types.ts           # TypeScript interfaces for all events
├── utils.ts           # Utility functions for authentication and room management
├── games.ts           # Games events (Plinko, Coin Flip, Crash, Sweeper)
├── betting.ts         # Betting events (odds, bets, payouts)
├── xp.ts              # XP & levels events
├── achievements.ts    # Achievements & badges events
├── inventory.ts       # Inventory & crates events
├── leaderboards.ts    # Leaderboards events
├── chat.ts            # Chat events (arena, forum, pvp)
└── admin.ts           # Admin & moderator events
```

## Event Channels

### 1. Games Channel (`games.ts`)

**Events:**
- `game-start` - Game initialization
- `game-result` - Game outcome
- `plinko-ball-drop` - Plinko ball path
- `crash-multiplier-update` - Crash game multiplier
- `coinflip-result` - Coin flip outcome
- `sweeper-mine-revealed` - Mine sweeper reveals
- `verify-fairness` - Fairness verification

**Features:**
- Real-time game results
- Fairness verification with seed validation
- Game room management
- Balance updates on wins

### 2. Betting Channel (`betting.ts`)

**Events:**
- `bet-placed` - Public bet placement notifications
- `bet-result` - Private bet outcome notifications
- `odds-update` - Real-time odds changes (admin only)
- `match-status-update` - Match status changes (admin only)
- `get-betting-stats` - Betting statistics

**Features:**
- Public bet notifications for social engagement
- Private bet results for individual users
- Admin controls for odds and match management
- Real-time betting statistics

### 3. XP & Levels Channel (`xp.ts`)

**Events:**
- `xp-gained` - XP gain notifications
- `level-up` - Level up celebrations
- `mission-progress` - Mission progress updates
- `mission-completed` - Mission completion rewards
- `daily-bonus-claimed` - Daily bonus claims
- `streak-updated` - Streak progress
- `prestige-achieved` - Prestige milestones

**Features:**
- Real-time XP and level updates
- Mission progress tracking
- Streak and bonus management
- Leaderboard integration

### 4. Achievements Channel (`achievements.ts`)

**Events:**
- `achievement-unlocked` - Achievement notifications
- `badge-earned` - Badge rewards
- `title-unlocked` - Title unlocks
- `collection-milestone` - Collection achievements
- `streak-achievement` - Streak milestones
- `special-event-achievement` - Special event rewards

**Features:**
- Instant achievement notifications
- Rare achievement broadcasts
- Progress tracking
- XP rewards integration

### 5. Inventory Channel (`inventory.ts`)

**Events:**
- `crate-opened` - Crate opening animations
- `item-acquired` - Item acquisition
- `item-equipped` - Equipment changes
- `item-unequipped` - Equipment removal
- `item-sold` - Item sales
- `trade-up-completed` - Trade-up results
- `sync-inventory` - Inventory synchronization

**Features:**
- Real-time inventory updates
- Crate opening animations
- Equipment management
- Trade-up system integration

### 6. Leaderboards Channel (`leaderboards.ts`)

**Events:**
- `get-leaderboard` - Leaderboard data requests
- `get-user-rank` - User rank queries
- `subscribe-leaderboard` - Leaderboard subscriptions
- `get-periodic-leaderboard` - Weekly/monthly leaderboards
- `leaderboard-position-changed` - Rank change notifications

**Features:**
- Real-time leaderboard updates
- User rank tracking
- Periodic leaderboards (weekly/monthly)
- Position change notifications

### 7. Chat Channel (`chat.ts`)

**Events:**
- `join-chat` - Channel joining
- `leave-chat` - Channel leaving
- `chat-message` - Message sending
- `private-message` - Private messaging
- `get-chat-history` - Message history
- `moderate-user` - Moderation actions
- `typing-start/stop` - Typing indicators
- `get-online-users` - Online user lists

**Features:**
- Multi-channel chat (arena, forum, pvp, coinflip)
- Private messaging
- Moderation tools
- Typing indicators
- Online user tracking

### 8. Admin Channel (`admin.ts`)

**Events:**
- `admin-broadcast` - Site-wide announcements
- `override-odds` - Odds manipulation
- `ban-user` - User banning
- `mute-user` - User muting
- `toggle-maintenance` - Maintenance mode
- `get-system-stats` - System statistics
- `get-admin-logs` - Admin action logs
- `lookup-user` - User information lookup

**Features:**
- Site-wide announcements
- User moderation tools
- System administration
- Audit logging

## Authentication & Security

### Socket Authentication

All socket connections are authenticated using session cookies:

```typescript
// Authentication flow
1. Client connects with session cookie
2. Server validates session in database
3. User info attached to socket
4. Access control based on user role
```

### Room Management

Users are automatically joined to:
- Personal room: `user-${userId}` (private updates)
- Game rooms: `game-${gameType}-${gameId}` (game-specific)
- Chat rooms: `chat-${channel}` (channel-specific)
- Admin room: `admin-room` (admin-only)
- Moderator room: `moderator-room` (moderator-only)

## Fallback System

### Automatic Fallback

The system includes a comprehensive fallback mechanism (`src/lib/socket-fallback.ts`) that:

1. **Detects disconnections** - Monitors socket connection status
2. **Falls back to REST APIs** - Uses HTTP requests when sockets fail
3. **Retries operations** - Implements exponential backoff
4. **Shows notifications** - Informs users of connection issues
5. **Syncs on reconnect** - Updates data when connection restored

### Usage Example

```typescript
import { withSocketFallback } from '@/lib/socket-fallback';

// Automatic fallback between socket and REST
const data = await withSocketFallback(
  () => socket.emit('get-balance'), // Socket operation
  () => fetch('/api/user/balance').then(r => r.json()), // REST fallback
  'get-balance' // Request ID
);
```

## Testing

### Test Page

Visit `/test-sockets` to test all socket channels:

- **Games**: Test game events and fairness verification
- **Betting**: Test bet placement and results
- **XP**: Test XP gain and level-up events
- **Achievements**: Test achievement unlocks
- **Inventory**: Test crate opening and item management
- **Leaderboards**: Test leaderboard updates
- **Chat**: Test chat functionality
- **Admin**: Test admin controls

### Event Monitoring

The test page shows:
- Real-time event logs
- Connection status
- Event data inspection
- Manual event triggering

## Integration with Existing APIs

### API Route Integration

Socket events are automatically emitted from existing API routes:

```typescript
// Example: Betting API emits socket events
if (global.io) {
  global.io.emit('bet-placed', {
    userId: session.user_id,
    username: userInfo?.displayName,
    matchId,
    team: teamId,
    amount,
    timestamp: new Date().toISOString()
  });
}
```

### Frontend Integration

Components automatically receive real-time updates:

```typescript
// Example: Real-time betting hook
const { isConnected } = useRealtimeBetting();

// Automatically shows:
// - Bet placement notifications
// - Bet result notifications
// - XP gain notifications
// - Level-up celebrations
```

## Performance Considerations

### Optimization Features

1. **Event Batching** - Multiple events batched together
2. **Room-based Broadcasting** - Events only sent to relevant users
3. **Connection Pooling** - Efficient socket management
4. **Rate Limiting** - Prevents spam and abuse
5. **Memory Management** - Automatic cleanup of old events

### Scalability

The modular design allows for:
- **Horizontal scaling** - Multiple server instances
- **Load balancing** - Socket.io clustering support
- **Database optimization** - Efficient queries and indexing
- **Caching** - Redis integration ready

## Deployment

### Environment Variables

```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:9003
NEXTAUTH_URL=http://localhost:9003
```

### Production Considerations

1. **SSL/TLS** - Use secure connections in production
2. **CORS Configuration** - Proper origin restrictions
3. **Rate Limiting** - Implement connection limits
4. **Monitoring** - Socket connection monitoring
5. **Logging** - Comprehensive event logging

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check CORS settings
   - Verify session authentication
   - Check network connectivity

2. **Event Not Received**
   - Verify room membership
   - Check event names match
   - Confirm user permissions

3. **Performance Issues**
   - Monitor connection count
   - Check database queries
   - Review event frequency

### Debug Tools

- Socket connection status indicator
- Event logging in browser console
- Test page for manual testing
- Admin logs for system monitoring

## Future Enhancements

### Planned Features

1. **Redis Integration** - For horizontal scaling
2. **Event Persistence** - Store events for replay
3. **Analytics** - Event tracking and metrics
4. **Mobile Support** - Native mobile app integration
5. **Voice Chat** - WebRTC integration
6. **Screen Sharing** - Game streaming features

This Socket.IO integration provides a robust, scalable foundation for real-time features while maintaining backward compatibility with existing REST APIs.
