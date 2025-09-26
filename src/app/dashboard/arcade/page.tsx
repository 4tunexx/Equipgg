
'use client';

import React, { useState, useEffect } from 'react'
import { CrashGame } from "../../../components/games/crash-game";
import { CoinflipGame } from "../../../components/games/coinflip-game";
import { PlinkoGame } from "../../../components/games/plinko-game";
import { SweeperGame } from "../../../components/games/sweeper-game";
import { Bomb, Coins, Gamepad2, Puzzle, Rocket, Loader2 } from "lucide-react";

// Inline UI Components
const Tabs = ({ children, defaultValue, className = '' }: { children: React.ReactNode; defaultValue?: string; className?: string }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <div className={className} data-active-tab={activeTab}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // Only pass activeTab/setActiveTab to specific tab-related components
          const childType = (child.type as any)?.displayName || (child.type as any)?.name || '';
          if (childType === 'TabsList' || childType === 'TabsTrigger' || childType === 'TabsContent' || 
              child.type === TabsList || child.type === TabsTrigger || child.type === TabsContent) {
            return React.cloneElement(child as any, { activeTab, setActiveTab });
          }
        }
        return child;
      })}
    </div>
  );
};
Tabs.displayName = 'Tabs';

const TabsList = ({ children, className = '', activeTab, setActiveTab }: { children: React.ReactNode; className?: string; activeTab?: string; setActiveTab?: (value: string) => void }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}>
    {React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        // Only pass activeTab/setActiveTab to TabsTrigger components
        const childType = (child.type as any)?.displayName || (child.type as any)?.name || '';
        if (childType === 'TabsTrigger' || child.type === TabsTrigger) {
          return React.cloneElement(child as any, { activeTab, setActiveTab });
        }
      }
      return child;
    })}
  </div>
);
TabsList.displayName = 'TabsList';

const TabsTrigger = ({ children, value, activeTab, setActiveTab }: { children: React.ReactNode; value: string; activeTab?: string; setActiveTab?: (value: string) => void }) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === value ? 'bg-background text-foreground shadow-sm' : ''}`}
    onClick={() => setActiveTab?.(value)}
  >
    {children}
  </button>
);
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = ({ children, value, activeTab }: { children: React.ReactNode; value: string; activeTab?: string }) => 
  activeTab === value ? <div>{children}</div> : null;
TabsContent.displayName = 'TabsContent';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
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

const Table = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className="relative w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className}`}>
      {children}
    </table>
  </div>
);

const TableHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <thead className={`[&_tr]:border-b ${className}`}>
    {children}
  </thead>
);

const TableBody = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className}`}>
    {children}
  </tbody>
);

const TableRow = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`}>
    {children}
  </tr>
);

const TableHead = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}>
    {children}
  </th>
);

const TableCell = ({ children, className = '', colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`} colSpan={colSpan}>
    {children}
  </td>
);

// Simplified UserProfileLink component
const UserProfileLink = ({ user }: { user: any }) => (
  <div className="flex items-center gap-2">
    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
      {(user?.displayName || user?.name)?.[0] || '?'}
    </div>
    <span className="font-semibold">{user?.displayName || user?.name || 'Unknown'}</span>
  </div>
);

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

interface ApiGameData {
    id: string;
    user: {
        name: string;
        avatar: string;
        role?: string;
        xp?: number;
        level?: number;
    };
    gameType: string;
    winnings: number;
}

const getGameIcon = (gameType: string) => {
    switch (gameType) {
        case 'crash': return Rocket
        case 'coinflip': return Coins
        case 'plinko': return Puzzle
        case 'sweeper': return Bomb
        default: return Gamepad2
    }
}

export default function ArcadePage() {
    const [recentPlays, setRecentPlays] = useState<GamePlay[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchRecentPlays()
    }, [])

    const fetchRecentPlays = async () => {
        try {
            const response = await fetch('/api/games/history')
            if (response.ok) {
                const data = await response.json()
                const formattedPlays = data.history.map((game: ApiGameData) => ({
                    id: game.id,
                    user: {
                        name: game.user.displayName || game.user.name,
                        avatar: game.user.avatar,
                        dataAiHint: "user avatar",
                        xp: game.user.xp || 0,
                        role: game.user.role || 'user',
                        level: game.user.level || 1
                    },
                    game: game.gameType.charAt(0).toUpperCase() + game.gameType.slice(1),
                    winnings: game.winnings,
                    icon: getGameIcon(game.gameType)
                }))
                setRecentPlays(formattedPlays)
            }
        } catch (error) {
            console.error('Failed to fetch recent plays:', error)
        } finally {
            setIsLoading(false)
        }
    }
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
             <div className="text-center">
                <h1 className="text-3xl font-bold font-headline">Game Arcade</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
                    Test your luck and skill in our collection of exciting mini-games. Place your bets, challenge other players, and climb the leaderboards!
                </p>
            </div>
            <Tabs defaultValue="crash" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="grid grid-cols-4 w-full max-w-lg">
                        <TabsTrigger value="crash"><Rocket className="mr-2" />Crash</TabsTrigger>
                        <TabsTrigger value="coinflip"><Coins className="mr-2" />Coinflip</TabsTrigger>
                        <TabsTrigger value="plinko"><Puzzle className="mr-2" />Plinko</TabsTrigger>
                        <TabsTrigger value="sweeper"><Bomb className="mr-2" />Sweeper</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="crash">
                    <CrashGame />
                </TabsContent>
                <TabsContent value="coinflip">
                    <CoinflipGame />
                </TabsContent>
                <TabsContent value="plinko">
                    <PlinkoGame />
                </TabsContent>
                <TabsContent value="sweeper">
                    <SweeperGame />
                </TabsContent>
            </Tabs>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Plays</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Player</TableHead>
                                <TableHead>Game</TableHead>
                                <TableHead className="text-right">Winnings</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        <p className="text-sm text-muted-foreground mt-2">Loading recent plays...</p>
                                    </TableCell>
                                </TableRow>
                            ) : recentPlays.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        No recent games found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentPlays.map((play) => (
                                    <TableRow key={play.id}>
                                        <TableCell>
                                            <UserProfileLink user={play.user} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <play.icon className="w-4 h-4 text-primary" />
                                                <span>{play.game}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-yellow-400">
                                            {play.winnings > 0 ? `+${play.winnings.toLocaleString()}` : '0'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
