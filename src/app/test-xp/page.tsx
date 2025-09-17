'use client';

import { useState } from 'react';
import { XPManager, XPUtils } from '@/components/xp-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

export default function TestXPPage() {
  const { user } = useAuth();
  const [customAmount, setCustomAmount] = useState(100);
  const [customReason, setCustomReason] = useState('Test XP Award');
  const [isLoading, setIsLoading] = useState(false);

  const handleAwardXP = async (type: string) => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      let success = false;
      
      switch (type) {
        case 'login':
          success = await XPUtils.awardLoginXP(user.id);
          break;
        case 'game_win':
          success = await XPUtils.awardGameWinXP(user.id, 'Test Game');
          break;
        case 'bet':
          success = await XPUtils.awardBetXP(user.id, 100);
          break;
        case 'mission':
          success = await XPUtils.awardMissionXP(user.id, 'Test Mission');
          break;
        case 'custom':
          success = await XPUtils.awardCustomXP(user.id, customAmount, customReason);
          break;
      }
      
      if (success) {
        console.log(`${type} XP awarded successfully!`);
      } else {
        console.error(`Failed to award ${type} XP`);
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>XP System Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to test the XP system.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>XP System Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current XP Display */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Current XP Status</h3>
            <XPManager userId={user.id} showDisplay={true} showAnimations={true} />
          </div>

          {/* XP Award Buttons */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Award XP</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button 
                onClick={() => handleAwardXP('login')} 
                disabled={isLoading}
                variant="outline"
              >
                Login XP (+10)
              </Button>
              <Button 
                onClick={() => handleAwardXP('game_win')} 
                disabled={isLoading}
                variant="outline"
              >
                Game Win (+25)
              </Button>
              <Button 
                onClick={() => handleAwardXP('bet')} 
                disabled={isLoading}
                variant="outline"
              >
                Bet Placed (+3)
              </Button>
              <Button 
                onClick={() => handleAwardXP('mission')} 
                disabled={isLoading}
                variant="outline"
              >
                Mission (+50)
              </Button>
            </div>
          </div>

          {/* Custom XP Award */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Custom XP Award</h3>
            <div className="flex gap-2 items-end">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  min="1"
                  max="10000"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Reason for XP award"
                />
              </div>
              <Button 
                onClick={() => handleAwardXP('custom')} 
                disabled={isLoading}
              >
                Award XP
              </Button>
            </div>
          </div>

          {/* XP Requirements Display */}
          <div>
            <h3 className="text-lg font-semibold mb-2">XP Requirements (Levels 1-20)</h3>
            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div className="font-semibold">Level</div>
                <div className="font-semibold">XP Needed</div>
                <div className="font-semibold">Total XP</div>
                <div className="font-semibold">Progress</div>
                {Array.from({ length: 20 }, (_, i) => i + 1).map(level => (
                  <div key={level} className="contents">
                    <div>{level}</div>
                    <div>{level === 1 ? 0 : (500 + 200 * (level - 1) + 10 * Math.pow(level - 1, 2)).toLocaleString()}</div>
                    <div>{level === 1 ? 0 : Array.from({ length: level - 1 }, (_, i) => 
                      500 + 200 * i + 10 * Math.pow(i, 2)
                    ).reduce((a, b) => a + b, 0).toLocaleString()}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (level / 20) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
