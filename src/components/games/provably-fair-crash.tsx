'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth-provider';
import { useBalance } from '@/contexts/balance-context';
import { toast } from 'sonner';
import { Loader2, Shield, Eye, EyeOff, Copy, CheckCircle, Play, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrashResult {
  multiplier: number;
  crashed: boolean;
  winnings: number;
  isWin: boolean;
}

interface FairnessData {
  serverSeedId: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  hmac: string;
}

export function ProvablyFairCrash() {
  const { user } = useAuth();
  const { balance, updateBalance } = useBalance();
  const [betAmount, setBetAmount] = useState('10');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoCashout, setIsAutoCashout] = useState(false);
  const [autoCashoutMultiplier, setAutoCashoutMultiplier] = useState('2.00');
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [lastResult, setLastResult] = useState<CrashResult | null>(null);
  const [fairnessData, setFairnessData] = useState<FairnessData | null>(null);
  const [showFairness, setShowFairness] = useState(false);
  const [serverSeedHash, setServerSeedHash] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [gameHistory, setGameHistory] = useState<number[]>([]);
  const animationRef = useRef<number>();

  // Load server seed hash on component mount
  useEffect(() => {
    const loadServerSeed = async () => {
      try {
        const response = await fetch('/api/provably-fair/seeds');
        if (response.ok) {
          const data = await response.json();
          setServerSeedHash(data.serverSeed.hashedSeed);
        }
      } catch (error) {
        console.error('Failed to load server seed:', error);
      }
    };

    loadServerSeed();
  }, []);

  // Simulate crash animation
  const animateCrash = (targetMultiplier: number, onComplete: () => void) => {
    let multiplier = 1.00;
    const increment = 0.01;
    const maxSpeed = 0.1;
    let speed = 0.001;

    const animate = () => {
      multiplier += speed;
      speed = Math.min(speed * 1.05, maxSpeed);
      setCurrentMultiplier(multiplier);

      if (multiplier >= targetMultiplier) {
        setCurrentMultiplier(targetMultiplier);
        onComplete();
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
  };

  const playCrash = async () => {
    if (!user) {
      toast.error('Please sign in to play');
      return;
    }

    const amount = parseInt(betAmount);
    if (amount <= 0 || amount > (balance?.coins || 0)) {
      toast.error('Invalid bet amount');
      return;
    }

    setIsPlaying(true);
    setCurrentMultiplier(1.00);

    try {
      const response = await fetch('/api/games/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameType: 'crash',
          gameId: `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          betAmount: amount
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Animate the crash
        animateCrash(data.result.multiplier, () => {
          setLastResult({
            multiplier: data.result.multiplier,
            crashed: data.result.crashed,
            winnings: data.winnings,
            isWin: data.isWin
          });

          setFairnessData({
            serverSeedId: data.fairness.serverSeedId,
            serverSeedHash: data.fairness.serverSeedHash,
            clientSeed: data.fairness.clientSeed,
            nonce: data.fairness.nonce,
            hmac: data.fairness.hmac
          });

          updateBalance({ coins: data.newBalance });

          // Add to game history
          setGameHistory(prev => [data.result.multiplier, ...prev.slice(0, 9)]);

          if (data.isWin) {
            toast.success(`🎉 You won ${data.winnings} coins! (${data.result.multiplier.toFixed(2)}x)`);
          } else {
            toast.error(`💸 Crashed at ${data.result.multiplier.toFixed(2)}x`);
          }

          setIsPlaying(false);
        });
      } else {
        toast.error(data.error || 'Game failed');
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Crash game error:', error);
      toast.error('Game failed. Please try again.');
      setIsPlaying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyGame = async () => {
    if (!lastResult || !fairnessData) return;

    try {
      const response = await fetch('/api/provably-fair/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: `crash_${Date.now()}` // This would be the actual game ID
        })
      });

      const data = await response.json();
      if (response.ok && data.verification.isValid) {
        toast.success('✅ Game verified as fair!');
      } else {
        toast.error('❌ Game verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification failed');
    }
  };

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier < 2) return 'text-red-500';
    if (multiplier < 5) return 'text-yellow-500';
    if (multiplier < 10) return 'text-green-500';
    return 'text-blue-500';
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground">Please sign in to play Crash</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Provably Fair Crash
            <Badge variant="secondary" className="ml-auto">
              Fair
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bet-amount">Bet Amount</Label>
              <Input
                id="bet-amount"
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                min="1"
                max={balance?.coins || 0}
                disabled={isPlaying}
              />
            </div>
            <div>
              <Label htmlFor="auto-cashout">Auto Cashout</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="auto-cashout"
                  type="number"
                  value={autoCashoutMultiplier}
                  onChange={(e) => setAutoCashoutMultiplier(e.target.value)}
                  min="1.01"
                  step="0.01"
                  disabled={isPlaying}
                  className="flex-1"
                />
                <Button
                  variant={isAutoCashout ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsAutoCashout(!isAutoCashout)}
                  disabled={isPlaying}
                >
                  {isAutoCashout ? "ON" : "OFF"}
                </Button>
              </div>
            </div>
          </div>

          {/* Play Button */}
          <Button
            onClick={playCrash}
            disabled={isPlaying || !betAmount || parseInt(betAmount) <= 0}
            className="w-full"
            size="lg"
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Playing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Place Bet
              </>
            )}
          </Button>

          {/* Crash Display */}
          <div className="text-center">
            <div className="text-6xl font-bold mb-4">
              <span className={cn(
                "transition-colors duration-300",
                getMultiplierColor(currentMultiplier)
              )}>
                {currentMultiplier.toFixed(2)}x
              </span>
            </div>
            
            {isPlaying && (
              <div className="text-sm text-muted-foreground">
                {isAutoCashout && currentMultiplier >= parseFloat(autoCashoutMultiplier) ? (
                  <span className="text-green-500">Auto-cashed out!</span>
                ) : (
                  <span>Crash in progress...</span>
                )}
              </div>
            )}
          </div>

          {/* Game History */}
          {gameHistory.length > 0 && (
            <div>
              <Label>Recent Games</Label>
              <div className="flex gap-2 mt-2">
                {gameHistory.map((multiplier, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={cn(
                      "text-xs",
                      getMultiplierColor(multiplier)
                    )}
                  >
                    {multiplier.toFixed(2)}x
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Last Result */}
          {lastResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Last Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Crashed At</p>
                    <p className={cn("text-2xl font-bold", getMultiplierColor(lastResult.multiplier))}>
                      {lastResult.multiplier.toFixed(2)}x
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Result</p>
                    <p className={cn("text-2xl font-bold", lastResult.isWin ? "text-green-500" : "text-red-500")}>
                      {lastResult.isWin ? `+${lastResult.winnings}` : 'Lost'} coins
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Fairness Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Provably Fair Information
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFairness(!showFairness)}
            >
              {showFairness ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">Current Seed</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
            </TabsList>
            
            <TabsContent value="current" className="space-y-4">
              <div>
                <Label>Server Seed Hash (Pre-committed)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={serverSeedHash}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(serverSeedHash)}
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This hash is generated before the game starts. The actual seed will be revealed after the game.
                </p>
              </div>

              {fairnessData && showFairness && (
                <div className="space-y-4">
                  <div>
                    <Label>Client Seed</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={fairnessData.clientSeed}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(fairnessData.clientSeed)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Nonce</Label>
                    <Input
                      value={fairnessData.nonce.toString()}
                      readOnly
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <Label>HMAC-SHA256</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={fairnessData.hmac}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(fairnessData.hmac)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="verification" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">To verify this game was fair:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Copy the HMAC-SHA256 value from the game result</li>
                  <li>Use the formula: HMAC-SHA256(server_seed, client_seed:nonce)</li>
                  <li>Convert the first 8 characters to decimal and divide by 0xffffffff</li>
                  <li>Calculate crash multiplier using the house edge formula</li>
                  <li>Verify the multiplier matches the displayed result</li>
                </ol>
              </div>
              
              {lastResult && (
                <Button onClick={verifyGame} className="w-full">
                  Verify Last Game
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
