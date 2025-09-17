'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/socket-context';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function TestSocketPage() {
  const { socket, isConnected, emitBetPlaced, emitXpGained } = useSocket();
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [testAmount, setTestAmount] = useState('100');

  useEffect(() => {
    if (!socket) return;

    const handleBetPlaced = (data: any) => {
      setEvents(prev => [...prev, { type: 'betPlaced', data, timestamp: new Date().toLocaleTimeString() }]);
    };

    const handleBetResult = (data: any) => {
      setEvents(prev => [...prev, { type: 'betResult', data, timestamp: new Date().toLocaleTimeString() }]);
    };

    const handleXpGained = (data: any) => {
      setEvents(prev => [...prev, { type: 'xpGained', data, timestamp: new Date().toLocaleTimeString() }]);
    };

    const handleBalanceUpdated = (data: any) => {
      setEvents(prev => [...prev, { type: 'balanceUpdated', data, timestamp: new Date().toLocaleTimeString() }]);
    };

    socket.on('betPlaced', handleBetPlaced);
    socket.on('betResult', handleBetResult);
    socket.on('xpGained', handleXpGained);
    socket.on('balanceUpdated', handleBalanceUpdated);

    return () => {
      socket.off('betPlaced', handleBetPlaced);
      socket.off('betResult', handleBetResult);
      socket.off('xpGained', handleXpGained);
      socket.off('balanceUpdated', handleBalanceUpdated);
    };
  }, [socket]);

  const testBetPlaced = () => {
    emitBetPlaced({
      userId: user?.id || 'test-user',
      username: user?.displayName || 'Test User',
      matchId: 'test-match-1',
      team: 'Team A',
      amount: parseInt(testAmount)
    });
  };

  const testXpGained = () => {
    emitXpGained({
      userId: user?.id || 'test-user',
      amount: 50,
      source: 'test_activity',
      newLevel: 5,
      leveledUp: true
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Socket.io Test Page
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              type="number"
              placeholder="Bet Amount"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              className="w-32"
            />
            <Button onClick={testBetPlaced} disabled={!isConnected}>
              Test Bet Placed
            </Button>
            <Button onClick={testXpGained} disabled={!isConnected}>
              Test XP Gained
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>User ID: {user?.id || 'Not logged in'}</p>
            <p>Socket ID: {socket?.id || 'Not connected'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-muted-foreground">No events received yet...</p>
            ) : (
              events.slice(-10).reverse().map((event, index) => (
                <div key={index} className="p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
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
