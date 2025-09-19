'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ProvablyFairPlinko } from "../../components/games/provably-fair-plinko";
import { ProvablyFairCrash } from "../../components/games/provably-fair-crash";
import { Shield, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface ServerSeed {
  id: string;
  hashedSeed: string;
  createdAt: string;
}

interface GameHistory {
  gameId: string;
  gameType: string;
  nonce: number;
  result: any;
  createdAt: string;
}

export default function TestProvablyFairPage() {
  const [serverSeed, setServerSeed] = useState<ServerSeed | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load server seed
        const seedResponse = await fetch('/api/provably-fair/seeds');
        if (seedResponse.ok) {
          const seedData = await seedResponse.json();
          setServerSeed(seedData.serverSeed);
        }

        // Load game history
        const historyResponse = await fetch('/api/provably-fair/verify');
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setGameHistory(historyData.gameHistory || []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const seedResponse = await fetch('/api/provably-fair/seeds');
      if (seedResponse.ok) {
        const seedData = await seedResponse.json();
        setServerSeed(seedData.serverSeed);
      }

      const historyResponse = await fetch('/api/provably-fair/verify');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setGameHistory(historyData.gameHistory || []);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading provably fair system...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-500" />
            Provably Fair System Test
            <Badge variant="secondary" className="ml-auto">
              HMAC-SHA256
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm">Server Seeds Pre-committed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm">Client Seeds User-controlled</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm">HMAC-SHA256 Verification</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Current Server Seed</h3>
              {serverSeed ? (
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Hash (Pre-committed)</p>
                    <p className="font-mono text-sm break-all">{serverSeed.hashedSeed}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(serverSeed.createdAt).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No server seed available</p>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Game History</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Total games: {gameHistory.length}
                </p>
                {gameHistory.length > 0 && (
                  <div className="max-h-32 overflow-y-auto">
                    {gameHistory.slice(0, 5).map((game, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded text-xs">
                        <span className="font-mono">{game.gameType}</span>
                        <span className="text-muted-foreground">#{game.nonce}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Provably Fair Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">1. Server Seed Generation</h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Server generates a random 256-bit seed</li>
                <li>• Seed is hashed with SHA-256 and exposed to players</li>
                <li>• Original seed is kept secret until after the game</li>
                <li>• Players can verify the hash matches the revealed seed</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">2. Game Result Generation</h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• HMAC-SHA256(server_seed, client_seed:nonce)</li>
                <li>• Client seed is user-controlled (optional)</li>
                <li>• Nonce increments with each game</li>
                <li>• Result derived from HMAC output</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">3. Verification Process</h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• After game, server reveals the original seed</li>
                <li>• Players can verify hash matches revealed seed</li>
                <li>• Players can recalculate HMAC and verify result</li>
                <li>• Complete transparency and fairness</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">4. Security Features</h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Server cannot manipulate results after seed is hashed</li>
                <li>• Client seeds prevent server from pre-calculating results</li>
                <li>• Nonce ensures each game is unique</li>
                <li>• HMAC-SHA256 is cryptographically secure</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Tests */}
      <Tabs defaultValue="plinko" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plinko">Plinko Test</TabsTrigger>
          <TabsTrigger value="crash">Crash Test</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plinko">
          <ProvablyFairPlinko />
        </TabsContent>
        
        <TabsContent value="crash">
          <ProvablyFairCrash />
        </TabsContent>
      </Tabs>

      {/* Verification Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Manual Verification</h3>
              <p className="text-sm text-muted-foreground mb-3">
                You can verify any game result manually using the following steps:
              </p>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Get the server seed, client seed, and nonce from the game result</li>
                <li>Calculate HMAC-SHA256(server_seed, "client_seed:nonce")</li>
                <li>Convert the first 8 characters of the HMAC to decimal</li>
                <li>Divide by 0xffffffff to get a value between 0 and 1</li>
                <li>Use this value to determine the game result according to the game rules</li>
              </ol>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={refreshData} variant="outline">
                Refresh Data
              </Button>
              <Button 
                onClick={() => window.open('https://www.freeformatter.com/hmac-generator.html', '_blank')}
                variant="outline"
              >
                Online HMAC Calculator
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fairness Guarantee */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Fairness Guarantee
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-green-600">What We Guarantee</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Server seeds are generated before games start</li>
                <li>✓ Seed hashes are publicly available before games</li>
                <li>✓ Game results are derived from HMAC-SHA256</li>
                <li>✓ All games can be independently verified</li>
                <li>✓ No manipulation of results is possible</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-blue-600">How to Verify</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Check that server seed hash was published before the game</li>
                <li>• Verify the revealed seed matches the published hash</li>
                <li>• Calculate the HMAC using the provided formula</li>
                <li>• Confirm the game result matches your calculation</li>
                <li>• Report any discrepancies immediately</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
