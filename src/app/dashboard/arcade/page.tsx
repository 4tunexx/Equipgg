
'use client';

import React, { useState, useEffect } from 'react'
import { CrashGame } from "../../../components/games/crash-game";
import { CoinflipGame } from "../../../components/games/coinflip-game";
import { PlinkoGame } from "../../../components/games/plinko-game";
import { SweeperGame } from "../../../components/games/sweeper-game";
import { Bomb, Coins, Gamepad2, Puzzle, Rocket, TrendingUp, Zap, Target, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";

type GameType = 'landing' | 'crash' | 'coinflip' | 'plinko' | 'sweeper';

const gameData = [
  {
    id: 'crash' as GameType,
    name: 'Crash',
    description: 'Cash out before the rocket crashes! Higher multipliers = bigger rewards.',
    icon: Rocket,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    features: ['Real-time multipliers', 'Auto cashout', 'Live player feed'],
    maxMultiplier: '100x+'
  },
  {
    id: 'coinflip' as GameType,
    name: 'Coinflip',
    description: 'Simple 50/50 chance game. Choose heads or tails and double your coins!',
    icon: Coins,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    features: ['50/50 odds', 'Instant results', 'Double or nothing'],
    maxMultiplier: '2x'
  },
  {
    id: 'plinko' as GameType,
    name: 'Plinko',
    description: 'Drop the ball and watch it bounce! Hit high multiplier slots for big wins.',
    icon: Target,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    features: ['Physics simulation', 'Multiple multipliers', 'Exciting bounces'],
    maxMultiplier: '10x'
  },
  {
    id: 'sweeper' as GameType,
    name: 'Sweeper',
    description: 'Find the safe tiles and avoid the mines! Risk vs reward gameplay.',
    icon: Bomb,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    features: ['Strategic gameplay', 'Risk management', 'Progressive multipliers'],
    maxMultiplier: '5x+'
  }
];

export default function ArcadePage() {
  const [selectedGame, setSelectedGame] = useState<GameType>('landing');
  const [recentPlays, setRecentPlays] = useState<GamePlay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedGame === 'landing') {
      fetchRecentPlays();
    }
  }, [selectedGame]);

  const fetchRecentPlays = async () => {
    try {
      const response = await fetch('/api/games/history?limit=5');
      if (response.ok) {
        const data = await response.json();
        
        // The API returns data.history not data.games
        const gamesArray = data.history || [];
        
        if (!Array.isArray(gamesArray)) {
          setRecentPlays([]);
          return;
        }
        
        const formattedPlays = gamesArray.map((game: any) => {
          if (!game) return null;
          
          return {
            id: game.id || 'unknown',
            user: {
              name: 'You',
              avatar: '',
              dataAiHint: "user avatar",
              xp: game.xp_gained || 0,
              role: 'user',
              level: 1
            },
            game: (game.game_type || 'unknown').charAt(0).toUpperCase() + (game.game_type || 'unknown').slice(1),
            winnings: game.winnings || 0,
            icon: getGameIcon(game.game_type || 'unknown')
          };
        }).filter((play): play is NonNullable<typeof play> => play !== null);
        
        setRecentPlays(formattedPlays);
      }
    } catch (error) {
      console.error('Failed to fetch recent plays:', error);
      setRecentPlays([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case 'crash': return Rocket;
      case 'coinflip': return Coins;
      case 'plinko': return Target;
      case 'sweeper': return Bomb;
      default: return Gamepad2;
    }
  };

  if (selectedGame === 'landing') {
    return (
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Header - Centered */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Gamepad2 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Arcade Games</h1>
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose your game and test your luck with exciting multipliers
          </p>
        </div>

        {/* Game Selection Cards - Centered Grid */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {gameData.map((game) => {
              const IconComponent = game.icon;
              return (
                <Card 
                  key={game.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border group h-full"
                  onClick={() => setSelectedGame(game.id)}
                >
                  <CardContent className="p-6 h-full flex flex-col justify-between">
                    <div className="text-center space-y-4">
                      <div className={`w-16 h-16 mx-auto rounded-xl ${game.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className={`w-8 h-8 ${game.color}`} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg">{game.name}</h3>
                        <p className={`text-lg font-bold ${game.color}`}>{game.maxMultiplier}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Play Now
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Featured Section - Centered */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Main Featured Game */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="text-center lg:text-left">
                      <CardTitle className="flex items-center justify-center lg:justify-start gap-2 text-2xl">
                        <Rocket className="w-6 h-6 text-red-500" />
                        Featured: Crash Game
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        Most popular with multipliers up to 100x+
                      </CardDescription>
                    </div>
                    <Button size="lg" onClick={() => setSelectedGame('crash')} className="shrink-0">
                      Play Now
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Max Multiplier</p>
                      <p className="text-2xl font-bold text-red-500">100x+</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <p className="text-sm text-muted-foreground mb-1">RTP</p>
                      <p className="text-2xl font-semibold">99%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-xl text-center lg:text-left">Recent Plays</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      <p className="text-sm text-muted-foreground mt-3">Loading...</p>
                    </div>
                  ) : recentPlays.length === 0 ? (
                    <div className="text-center py-8">
                      <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">No recent games</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentPlays.map((play) => {
                        const IconComponent = play.icon;
                        return (
                          <div key={play.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded bg-background">
                                <IconComponent className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-sm font-medium">{play.game}</span>
                            </div>
                            <span className="text-sm font-mono text-yellow-400 font-bold">
                              {play.winnings > 0 ? `+${play.winnings}` : '0'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show selected game with back button
  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => setSelectedGame('landing')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Games
        </Button>
        <h1 className="text-2xl font-bold capitalize">{selectedGame} Game</h1>
      </div>
      
      <div className="w-full">
        {selectedGame === 'crash' && <CrashGame />}
        {selectedGame === 'coinflip' && <CoinflipGame />}
        {selectedGame === 'plinko' && <PlinkoGame />}
        {selectedGame === 'sweeper' && <SweeperGame />}
      </div>
    </div>
  );
}

// Card Components
const Card = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} onClick={onClick}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-muted-foreground ${className}`}>
    {children}
  </p>
);

// User and Game Interfaces
interface GameUser {
  name: string;
  avatar: string;
  dataAiHint: string;
  xp: number;
  role?: string;
  level?: number;
}

interface GamePlay {
  id: string;
  user: GameUser;
  game: string;
  winnings: number;
  icon: React.ComponentType<{ className?: string }>;
}
