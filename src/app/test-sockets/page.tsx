'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/socket-context';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface SocketEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  source: 'received' | 'sent';
}

export default function TestSocketsPage() {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [events, setEvents] = useState<SocketEvent[]>([]);
  const [testData, setTestData] = useState({
    gameType: 'plinko',
    gameId: 'test-game-1',
    betAmount: '100',
    matchId: 'test-match-1',
    teamId: 'Team A',
    amount: '500',
    odds: '2.5',
    channel: 'arena',
    message: 'Test message',
    achievementId: 'test-achievement',
    itemId: 'test-item-1',
    crateId: 'test-crate-1'
  });

  useEffect(() => {
    if (!socket) return;

    const addEvent = (type: string, data: any, source: 'received' | 'sent' = 'received') => {
      const event: SocketEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: new Date().toLocaleTimeString(),
        source
      };
      setEvents(prev => [...prev.slice(-49), event]); // Keep last 50 events
    };

    // Games events
    socket.on('game-started', (data) => addEvent('game-started', data));
    socket.on('game-result', (data) => addEvent('game-result', data));
    socket.on('plinko-ball-dropped', (data) => addEvent('plinko-ball-dropped', data));
    socket.on('crash-update', (data) => addEvent('crash-update', data));
    socket.on('coinflip-result', (data) => addEvent('coinflip-result', data));
    socket.on('mine-revealed', (data) => addEvent('mine-revealed', data));

    // Betting events
    socket.on('bet-placed', (data) => addEvent('bet-placed', data));
    socket.on('bet-result', (data) => addEvent('bet-result', data));
    socket.on('odds-updated', (data) => addEvent('odds-updated', data));
    socket.on('match-status-updated', (data) => addEvent('match-status-updated', data));

    // XP events
    socket.on('xp-gained', (data) => addEvent('xp-gained', data));
    socket.on('level-up', (data) => addEvent('level-up', data));
    socket.on('mission-progress', (data) => addEvent('mission-progress', data));
    socket.on('mission-completed', (data) => addEvent('mission-completed', data));

    // Achievement events
    socket.on('achievement-unlocked', (data) => addEvent('achievement-unlocked', data));
    socket.on('badge-earned', (data) => addEvent('badge-earned', data));
    socket.on('title-unlocked', (data) => addEvent('title-unlocked', data));

    // Inventory events
    socket.on('crate-opened', (data) => addEvent('crate-opened', data));
    socket.on('item-acquired', (data) => addEvent('item-acquired', data));
    socket.on('item-equipped', (data) => addEvent('item-equipped', data));
    socket.on('item-sold', (data) => addEvent('item-sold', data));

    // Leaderboard events
    socket.on('leaderboard-updated', (data) => addEvent('leaderboard-updated', data));
    socket.on('leaderboard-position-changed', (data) => addEvent('leaderboard-position-changed', data));

    // Chat events
    socket.on('chat-message', (data) => addEvent('chat-message', data));
    socket.on('user-joined', (data) => addEvent('user-joined', data));
    socket.on('user-left', (data) => addEvent('user-left', data));
    socket.on('private-message', (data) => addEvent('private-message', data));

    // Admin events
    socket.on('admin-broadcast', (data) => addEvent('admin-broadcast', data));
    socket.on('odds-override', (data) => addEvent('odds-override', data));
    socket.on('user-banned', (data) => addEvent('user-banned', data));
    socket.on('maintenance-mode', (data) => addEvent('maintenance-mode', data));

    // Balance events
    socket.on('balance-updated', (data) => addEvent('balance-updated', data));

    return () => {
      socket.off('game-started');
      socket.off('game-result');
      socket.off('bet-placed');
      socket.off('bet-result');
      socket.off('xp-gained');
      socket.off('level-up');
      socket.off('achievement-unlocked');
      socket.off('crate-opened');
      socket.off('leaderboard-updated');
      socket.off('chat-message');
      socket.off('admin-broadcast');
      socket.off('balance-updated');
    };
  }, [socket]);

  const emitEvent = (eventType: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(eventType, data);
      const event: SocketEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: eventType,
        data,
        timestamp: new Date().toLocaleTimeString(),
        source: 'sent'
      };
      setEvents(prev => [...prev.slice(-49), event]);
    }
  };

  const clearEvents = () => setEvents([]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Socket.io Test Suite
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>User ID: {user?.id || 'Not logged in'}</p>
            <p>Socket ID: {socket?.id || 'Not connected'}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="games" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="betting">Betting</TabsTrigger>
          <TabsTrigger value="xp">XP & Levels</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="games" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Games Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Game Type</label>
                  <Select value={testData.gameType} onValueChange={(value) => setTestData(prev => ({ ...prev, gameType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plinko">Plinko</SelectItem>
                      <SelectItem value="coinflip">Coin Flip</SelectItem>
                      <SelectItem value="crash">Crash</SelectItem>
                      <SelectItem value="sweeper">Sweeper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Game ID</label>
                  <Input value={testData.gameId} onChange={(e) => setTestData(prev => ({ ...prev, gameId: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => emitEvent('game-start', {
                  gameId: testData.gameId,
                  gameType: testData.gameType,
                  betAmount: parseInt(testData.betAmount)
                })}>
                  Start Game
                </Button>
                <Button onClick={() => emitEvent('game-result', {
                  gameId: testData.gameId,
                  gameType: testData.gameType,
                  result: { multiplier: 2.5 },
                  winnings: 250,
                  isWin: true
                })}>
                  Game Result
                </Button>
                <Button onClick={() => emitEvent('verify-fairness', {
                  gameId: testData.gameId,
                  gameType: testData.gameType,
                  seed: 'test-seed-123'
                })}>
                  Verify Fairness
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="betting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Betting Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Match ID</label>
                  <Input value={testData.matchId} onChange={(e) => setTestData(prev => ({ ...prev, matchId: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium">Team ID</label>
                  <Input value={testData.teamId} onChange={(e) => setTestData(prev => ({ ...prev, teamId: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input value={testData.amount} onChange={(e) => setTestData(prev => ({ ...prev, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium">Odds</label>
                  <Input value={testData.odds} onChange={(e) => setTestData(prev => ({ ...prev, odds: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => emitEvent('bet-placed', {
                  matchId: testData.matchId,
                  teamId: testData.teamId,
                  amount: parseInt(testData.amount),
                  odds: parseFloat(testData.odds),
                  potentialPayout: parseInt(testData.amount) * parseFloat(testData.odds)
                })}>
                  Place Bet
                </Button>
                <Button onClick={() => emitEvent('bet-result', {
                  betId: 'test-bet-1',
                  matchId: testData.matchId,
                  won: true,
                  amount: parseInt(testData.amount),
                  winnings: parseInt(testData.amount) * parseFloat(testData.odds)
                })}>
                  Bet Result
                </Button>
                <Button onClick={() => emitEvent('odds-update', {
                  matchId: testData.matchId,
                  team1Odds: 1.8,
                  team2Odds: 2.2
                })}>
                  Update Odds
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="xp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>XP & Levels Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={() => emitEvent('xp-gained', {
                  amount: 50,
                  source: 'test_activity',
                  newLevel: 5,
                  leveledUp: true
                })}>
                  XP Gained
                </Button>
                <Button onClick={() => emitEvent('mission-progress', {
                  missionId: 'test-mission-1',
                  progress: 75,
                  completed: false
                })}>
                  Mission Progress
                </Button>
                <Button onClick={() => emitEvent('mission-completed', {
                  missionId: 'test-mission-1',
                  reward: { coins: 100, xp: 50 }
                })}>
                  Mission Completed
                </Button>
                <Button onClick={() => emitEvent('daily-bonus-claimed', {
                  bonusType: 'coins',
                  amount: 500
                })}>
                  Daily Bonus
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Achievements Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={() => emitEvent('achievement-unlocked', {
                  achievementId: testData.achievementId,
                  title: 'Test Achievement',
                  description: 'This is a test achievement',
                  xpReward: 100
                })}>
                  Unlock Achievement
                </Button>
                <Button onClick={() => emitEvent('badge-earned', {
                  badgeId: 'test-badge-1',
                  badgeName: 'Test Badge',
                  rarity: 'rare'
                })}>
                  Earn Badge
                </Button>
                <Button onClick={() => emitEvent('title-unlocked', {
                  titleId: 'test-title-1',
                  titleName: 'Test Title',
                  description: 'A test title'
                })}>
                  Unlock Title
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={() => emitEvent('crate-opened', {
                  crateId: testData.crateId,
                  items: [
                    { id: 'item-1', name: 'Test Item', rarity: 'rare', value: 100 }
                  ],
                  totalValue: 100
                })}>
                  Open Crate
                </Button>
                <Button onClick={() => emitEvent('item-acquired', {
                  itemId: testData.itemId,
                  itemName: 'Test Item',
                  rarity: 'epic',
                  source: 'crate'
                })}>
                  Acquire Item
                </Button>
                <Button onClick={() => emitEvent('item-equipped', {
                  itemId: testData.itemId,
                  slot: 'pistol'
                })}>
                  Equip Item
                </Button>
                <Button onClick={() => emitEvent('item-sold', {
                  itemId: testData.itemId,
                  price: 150
                })}>
                  Sell Item
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboards Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={() => emitEvent('get-leaderboard', { type: 'coins' })}>
                  Get Coins Leaderboard
                </Button>
                <Button onClick={() => emitEvent('get-leaderboard', { type: 'xp' })}>
                  Get XP Leaderboard
                </Button>
                <Button onClick={() => emitEvent('get-user-rank', { type: 'coins' })}>
                  Get User Rank
                </Button>
                <Button onClick={() => emitEvent('subscribe-leaderboard', { type: 'coins' })}>
                  Subscribe to Leaderboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chat Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Channel</label>
                  <Select value={testData.channel} onValueChange={(value) => setTestData(prev => ({ ...prev, channel: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arena">Arena</SelectItem>
                      <SelectItem value="forum">Forum</SelectItem>
                      <SelectItem value="pvp">PVP</SelectItem>
                      <SelectItem value="coinflip">Coinflip</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Input value={testData.message} onChange={(e) => setTestData(prev => ({ ...prev, message: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => emitEvent('join-chat', { channel: testData.channel })}>
                  Join Chat
                </Button>
                <Button onClick={() => emitEvent('chat-message', {
                  channel: testData.channel,
                  message: testData.message,
                  type: 'arena'
                })}>
                  Send Message
                </Button>
                <Button onClick={() => emitEvent('get-chat-history', { channel: testData.channel })}>
                  Get History
                </Button>
                <Button onClick={() => emitEvent('get-online-users', { channel: testData.channel })}>
                  Get Online Users
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={() => emitEvent('admin-broadcast', {
                  type: 'site_update',
                  message: 'Test broadcast message'
                })}>
                  Admin Broadcast
                </Button>
                <Button onClick={() => emitEvent('override-odds', {
                  matchId: testData.matchId,
                  team1Odds: 1.5,
                  team2Odds: 2.5,
                  reason: 'Test override'
                })}>
                  Override Odds
                </Button>
                <Button onClick={() => emitEvent('toggle-maintenance', {
                  enabled: true,
                  message: 'Site under maintenance'
                })}>
                  Toggle Maintenance
                </Button>
                <Button onClick={() => emitEvent('get-system-stats', {})}>
                  Get System Stats
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Real-time Events
            <Button onClick={clearEvents} variant="outline" size="sm">
              Clear Events
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-muted-foreground">No events received yet...</p>
            ) : (
              events.slice(-20).reverse().map((event) => (
                <div key={event.id} className={`p-3 rounded-lg border ${
                  event.source === 'sent' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={event.source === 'sent' ? 'default' : 'secondary'}>
                      {event.source === 'sent' ? 'Sent' : 'Received'}
                    </Badge>
                    <Badge variant="outline">{event.type}</Badge>
                    <span className="text-xs text-muted-foreground">{event.timestamp}</span>
                  </div>
                  <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
