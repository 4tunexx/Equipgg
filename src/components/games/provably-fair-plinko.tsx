'use client';

import { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useAuth } from "../auth-provider";
import { useBalance } from "../../contexts/balance-context";
import { toast } from 'sonner';
import { Loader2, Shield, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react';
import { cn } from "../../lib/utils";

interface PlinkoResult {
  path: number[];
  multiplier: number;
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

export function ProvablyFairPlinko() {
  const { user } = useAuth();
  const { balance, updateBalance } = useBalance();
  const [betAmount, setBetAmount] = useState('10');
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [rows, setRows] = useState(16);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<PlinkoResult | null>(null);
  const [fairnessData, setFairnessData] = useState<FairnessData | null>(null);
  const [showFairness, setShowFairness] = useState(false);
  const [serverSeedHash, setServerSeedHash] = useState<string>('');
  const [copied, setCopied] = useState(false);

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

  const playPlinko = async () => {
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

    try {
      const response = await fetch('/api/games/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameType: 'plinko',
          gameId: `plinko_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          betAmount: amount,
          risk,
          rows
        })
      });

      const data = await response.json();

      if (response.ok) {
        setLastResult({
          path: data.result.path,
          multiplier: data.result.multiplier,
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

        if (data.isWin) {
          toast.success(`🎉 You won ${data.winnings} coins! (${data.result.multiplier}x)`);
        } else {
          toast.error(`💸 Lost ${amount} coins`);
        }
      } else {
        toast.error(data.error || 'Game failed');
      }
    } catch (error) {
      console.error('Plinko game error:', error);
      toast.error('Game failed. Please try again.');
    } finally {
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
          gameId: `plinko_${Date.now()}` // This would be the actual game ID
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

  const renderPlinkoBoard = () => {
    const pegs = [];
    const slots = rows + 1;
    
    // Generate peg positions
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col <= row; col++) {
        pegs.push({ row, col });
      }
    }

    return (
      <div className="flex flex-col items-center space-y-2">
        {/* Pegs */}
        <div className="relative">
          {pegs.map((peg, index) => (
            <div
              key={index}
              className="absolute w-2 h-2 bg-blue-500 rounded-full"
              style={{
                left: `${(peg.col - peg.row / 2) * 20 + 200}px`,
                top: `${peg.row * 20 + 20}px`
              }}
            />
          ))}
        </div>

        {/* Ball path */}
        {lastResult && (
          <div className="relative">
            {lastResult.path.map((direction, index) => (
              <div
                key={index}
                className="absolute w-3 h-3 bg-orange-500 rounded-full animate-bounce"
                style={{
                  left: `${(index - rows / 2) * 20 + 200}px`,
                  top: `${index * 20 + 20}px`,
                  animationDelay: `${index * 0.1}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Slots */}
        <div className="flex space-x-1 mt-4">
          {Array.from({ length: slots }, (_, i) => {
            const position = i - (slots - 1) / 2;
            const isWinningSlot = lastResult && Math.abs(position) === Math.abs(lastResult.path.reduce((sum, dir) => sum + (dir === 1 ? 1 : -1), 0));
            
            return (
              <div
                key={i}
                className={cn(
                  "w-12 h-8 border-2 rounded flex items-center justify-center text-xs font-bold",
                  isWinningSlot ? "border-green-500 bg-green-100" : "border-gray-300 bg-gray-100"
                )}
              >
                {position}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground">Please sign in to play Plinko</p>
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
            Provably Fair Plinko
            <Badge variant="secondary" className="ml-auto">
              Fair
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="risk">Risk Level</Label>
              <select
                id="risk"
                value={risk}
                onChange={(e) => setRisk(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full p-2 border rounded-md"
                disabled={isPlaying}
              >
                <option value="low">Low Risk (0.5x - 5.6x)</option>
                <option value="medium">Medium Risk (0.2x - 33x)</option>
                <option value="high">High Risk (0x - 1000x)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="rows">Rows</Label>
              <select
                id="rows"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value))}
                className="w-full p-2 border rounded-md"
                disabled={isPlaying}
              >
                <option value="8">8 Rows</option>
                <option value="10">10 Rows</option>
                <option value="12">12 Rows</option>
                <option value="14">14 Rows</option>
                <option value="16">16 Rows</option>
              </select>
            </div>
          </div>

          {/* Play Button */}
          <Button
            onClick={playPlinko}
            disabled={isPlaying || !betAmount || parseInt(betAmount) <= 0}
            className="w-full"
            size="lg"
          >
            {isPlaying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Playing...
              </>
            ) : (
              'Drop Ball'
            )}
          </Button>

          {/* Plinko Board */}
          <div className="flex justify-center">
            {renderPlinkoBoard()}
          </div>

          {/* Last Result */}
          {lastResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Last Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Multiplier</p>
                    <p className="text-2xl font-bold">{lastResult.multiplier.toFixed(2)}x</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Winnings</p>
                    <p className={cn("text-2xl font-bold", lastResult.isWin ? "text-green-500" : "text-red-500")}>
                      {lastResult.isWin ? '+' : '-'}{lastResult.winnings} coins
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
                  <li>Use this value to determine the ball path (0-0.5 = left, 0.5-1 = right)</li>
                  <li>Verify the path matches the displayed result</li>
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
