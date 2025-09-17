
'use client';

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserProfileLink } from "@/components/user-profile-link";
import { CrashGame } from "@/components/games/crash-game";
import { CoinflipGame } from "@/components/games/coinflip-game";
import { PlinkoGame } from "@/components/games/plinko-game";
import { SweeperGame } from "@/components/games/sweeper-game";
import { Bomb, Coins, Gamepad2, Puzzle, Rocket, Loader2 } from "lucide-react";

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
                        name: game.user.name,
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
