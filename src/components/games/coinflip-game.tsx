
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Gem, Loader2, Swords, UserPlus, Users, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { UserProfileLink } from "../user-profile-link";
import { CoinflipGamePanel } from "./coinflip-game-panel";
import { useAuth } from "../../hooks/use-auth";
import { useSessionRepair } from "../../hooks/use-session-repair";
import { useBalance } from "../../contexts/balance-context";
import { toast } from 'sonner';

interface CoinflipGameHistoryItem {
    id: string;
    user: {
        name: string;
        avatar?: string;
        xp?: number;
    };
    betAmount: number;
    result?: {
        result?: 'heads' | 'tails';
        playerSide?: 'heads' | 'tails';
    };
    profit: number;
}

interface CoinflipLobby {
    id: string;
    creator: {
        username: string;
        level: number;
        vip_tier: string;
    };
    bet_amount: number;
    creator_side: 'heads' | 'tails';
    available_side: 'heads' | 'tails';
    status: string;
    created_at: string;
    result: string | null;
    winner_id: string | null;
    completed_at: string | null;
    joiner_id: string | null;
    timeLeft?: string; // This is added by frontend processing
}



export function CoinflipGame() {
    const { user } = useAuth();
    const { repairSession } = useSessionRepair();
    const [betAmount, setBetAmount] = useState('');
    const [selectedSide, setSelectedSide] = useState('heads');
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameHistory, setGameHistory] = useState<CoinflipGameHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lobbies, setLobbies] = useState<CoinflipLobby[]>([]);
    const [isLoadingLobbies, setIsLoadingLobbies] = useState(true);
    const [isJoining, setIsJoining] = useState<string | null>(null);
    const { balance: userBalance } = useBalance();
    const [activeGame, setActiveGame] = useState<{
        lobbyId: string;
        creator: {
            name: string;
            avatar: string;
            dataAiHint: string;
        };
        joiner: {
            name: string;
            avatar: string;
            dataAiHint: string;
        };
        betAmount: number;
        creatorSide: 'heads' | 'tails';
        joinerSide: 'heads' | 'tails';
        gameResult: {
            flipResult: 'heads' | 'tails';
            winner: {
                id: string;
                name: string;
            };
            loser: {
                id: string;
                name: string;
            };
            winnings: number;
            xpGained: number;
            betAmount: number;
        };
    } | null>(null);

    const fetchGameHistory = useCallback(async () => {
        try {
            const response = await fetch('/api/games/history?gameType=coinflip');
            if (response.ok) {
                const data = await response.json();
                setGameHistory(data.history || []);
            }
        } catch (error) {
            console.error('Failed to fetch game history:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchLobbies = useCallback(async () => {
        try {
            const response = await fetch('/api/coinflip/lobbies');
            if (response.ok) {
                const data = await response.json();
                // Process lobbies to add timeLeft calculation
                const processedLobbies = (data.lobbies || []).map((lobby: any) => {
                    // Calculate time left (5 minutes from creation)
                    const createdAt = new Date(lobby.created_at);
                    const now = new Date();
                    const timeElapsed = now.getTime() - createdAt.getTime();
                    const timeLeft = Math.max(0, 300000 - timeElapsed); // 5 minutes in ms
                    
                    console.log('Timer debug for lobby', lobby.id, {
                        created_at: lobby.created_at,
                        createdAt,
                        now,
                        timeElapsed,
                        timeLeft
                    });
                    
                    const minutes = Math.floor(timeLeft / 60000);
                    const seconds = Math.floor((timeLeft % 60000) / 1000);
                    const timeLeftString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    
                    return {
                        ...lobby,
                        timeLeft: timeLeftString
                    };
                });
                setLobbies(processedLobbies);
            } else if (response.status === 401) {
                console.log('Session corruption detected, attempting repair...');
                const repaired = await repairSession();
                if (repaired) {
                    // Retry the request after repair
                    const retryResponse = await fetch('/api/coinflip/lobbies');
                    if (retryResponse.ok) {
                        const retryData = await retryResponse.json();
                        const processedRetryLobbies = (retryData.lobbies || []).map((lobby: any) => {
                            // Calculate time left (5 minutes from creation)
                            const createdAt = new Date(lobby.created_at);
                            const now = new Date();
                            const timeElapsed = now.getTime() - createdAt.getTime();
                            const timeLeft = Math.max(0, 300000 - timeElapsed); // 5 minutes in ms
                            
                            const minutes = Math.floor(timeLeft / 60000);
                            const seconds = Math.floor((timeLeft % 60000) / 1000);
                            const timeLeftString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                            
                            return {
                                ...lobby,
                                timeLeft: timeLeftString
                            };
                        });
                        setLobbies(processedRetryLobbies);
                    }
                }
            } else if (response.status === 404) {
                console.error('Coinflip lobbies API not found (404). This might be a temporary routing issue.');
                // Don't set lobbies to empty array on 404, keep existing data
            } else {
                console.error('Unexpected response status:', response.status);
            }
        } catch (error) {
            console.error('Failed to fetch lobbies:', error);
        } finally {
            setIsLoadingLobbies(false);
        }
    }, [repairSession]);

    useEffect(() => {
        fetchGameHistory();
        fetchLobbies();
        
        // Refresh lobbies every 5 seconds (much more reasonable than 1 second)
        const interval = setInterval(fetchLobbies, 5000);
        
        // Update timers every second for real-time countdown
        const timerInterval = setInterval(() => {
            setLobbies(currentLobbies => currentLobbies.map(lobby => {
                // Recalculate time left
                const createdAt = new Date(lobby.created_at);
                const now = new Date();
                const timeElapsed = now.getTime() - createdAt.getTime();
                const timeLeft = Math.max(0, 300000 - timeElapsed); // 5 minutes in ms
                
                const minutes = Math.floor(timeLeft / 60000);
                const seconds = Math.floor((timeLeft % 60000) / 1000);
                const timeLeftString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                return {
                    ...lobby,
                    timeLeft: timeLeftString
                };
            }));
        }, 1000);
        
        return () => {
            clearInterval(interval);
            clearInterval(timerInterval);
        };
    }, [user, fetchGameHistory, fetchLobbies]);

    // No more frontend timer - let backend handle everything

    // User balance is now handled by the global balance context

    const handleCreateLobby = async () => {
        if (!user) {
            toast.error('Please sign in to play');
            return;
        }

        const amount = parseFloat(betAmount);
        if (!amount || amount <= 0) {
            toast.error('Please enter a valid bet amount');
            return;
        }

        // Check user balance
        if (!userBalance || amount > userBalance.coins) {
            toast.error(`You need ${amount.toLocaleString()} coins but only have ${userBalance?.coins?.toLocaleString() || 0} coins.`);
            return;
        }

        setIsPlaying(true);
        try {
            const response = await fetch('/api/coinflip/lobbies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    betAmount: amount,
                    side: selectedSide
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                toast.success(data.message);
                setBetAmount('');
                fetchLobbies(); // Refresh lobbies
                fetchGameHistory(); // Refresh history
                // Balance refresh handled by context
                window.dispatchEvent(new CustomEvent('balanceUpdated'));
            } else {
                toast.error(data.error || 'Failed to create lobby');
            }
        } catch {
            toast.error('Failed to create lobby');
        } finally {
            setIsPlaying(false);
        }
    };

    const handleJoinLobby = async (lobbyId: string) => {
        if (!user) {
            toast.error('Please sign in to play');
            return;
        }

        // Find the lobby to get creator info
        const lobby = lobbies.find(l => l.id === lobbyId);
        if (!lobby) {
            toast.error('Lobby not found');
            return;
        }

        // Check if user is trying to join their own lobby
        const currentUserName = user.displayName || user.email;
        if (lobby.creator.username === currentUserName) {
            toast.error("You can&apos;t join your own lobby! Create a different lobby or wait for someone else to join.");
            return;
        }

        // Check user balance before joining
        if (!userBalance || lobby.bet_amount > userBalance.coins) {
            toast.error(`You need ${lobby.bet_amount.toLocaleString()} coins but only have ${userBalance?.coins?.toLocaleString() || 0} coins.`);
            return;
        }

        setIsJoining(lobbyId);
        
        try {
            // Call the join API immediately
            const response = await fetch('/api/coinflip/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lobbyId })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Set up the game panel with the actual result
                setActiveGame({
                    lobbyId,
                    creator: {
                        name: lobby.creator.username,
                        avatar: '',
                        dataAiHint: 'user avatar'
                    },
                    joiner: {
                        name: user.displayName || user.email,
                        avatar: user.photoURL || '',
                        dataAiHint: 'user avatar'
                    },
                    betAmount: lobby.bet_amount,
                    creatorSide: lobby.creator_side,
                    joinerSide: lobby.creator_side === 'heads' ? 'tails' : 'heads',
                    gameResult: data.result // Pass the actual game result
                });
                
                // Refresh data
                fetchLobbies();
                fetchGameHistory();
                // Balance refresh handled by context
                window.dispatchEvent(new CustomEvent('balanceUpdated'));
                
                toast.success(`Game completed! ${data.result.winner.name} won ${data.result.winnings.toLocaleString()} coins!`);
            } else {
                toast.error(data.error || 'Failed to join lobby');
            }
        } catch {
            toast.error('Failed to join lobby');
        } finally {
            setIsJoining(null);
        }
    };

    const handleGameComplete = (result: { xpGained?: number }) => {
        setActiveGame(null);
        fetchLobbies(); // Refresh lobbies
        fetchGameHistory(); // Refresh history
        // Balance refresh handled by context
        
        // Dispatch events to update dashboard
        window.dispatchEvent(new CustomEvent('gameCompleted'));
        window.dispatchEvent(new CustomEvent('balanceUpdated'));
        if (result.xpGained && result.xpGained > 0) {
            window.dispatchEvent(new CustomEvent('xpUpdated'));
        }
    };

    const handleCloseGame = () => {
        setActiveGame(null);
    };

    const recentPlaysFromHistory = gameHistory.map(game => ({
        id: game.id,
        winner: game.profit > 0 ? { name: game.user.name, avatar: game.user.avatar || '', dataAiHint: "user avatar", xp: game.user.xp || 0, rank: 1 } : null,
        loser: game.profit <= 0 ? { name: game.user.name, avatar: game.user.avatar || '', dataAiHint: "user avatar", xp: game.user.xp || 0, rank: 1 } : null,
        amount: game.betAmount,
        result: game.result?.result || 'heads',
        playerSide: game.result?.playerSide || 'heads'
    }));

    return (
        <>
            {activeGame && (
                <CoinflipGamePanel
                    creator={activeGame.creator}
                    joiner={activeGame.joiner}
                    betAmount={activeGame.betAmount}
                    creatorSide={activeGame.creatorSide}
                    joinerSide={activeGame.joinerSide}
                    gameResult={activeGame.gameResult}
                    onGameComplete={handleGameComplete}
                    onClose={handleCloseGame}
                />
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="text-primary"/> Active Lobbies</CardTitle>
                        <CardDescription>Join an existing coinflip lobby or create your own.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Player</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Side</TableHead>
                                    <TableHead>Time Left</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingLobbies ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                            <p className="text-sm text-muted-foreground mt-2">Loading lobbies...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : lobbies.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No active lobbies found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    lobbies.map(lobby => (
                                        <TableRow key={lobby.id}>
                                            <TableCell>
                                                <UserProfileLink user={{...lobby.creator, rank: 1, xp: 0 }} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 font-mono text-yellow-400">
                                                    <Gem className="w-4 h-4"/>
                                                    {(lobby.bet_amount || 0).toLocaleString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize">{lobby.creator_side}</Badge>
                                            </TableCell>
                                            <TableCell className="font-mono">
                                                <span className={`${
                                                    lobby.timeLeft === '0:00' 
                                                        ? 'text-red-500 font-bold' 
                                                        : lobby.timeLeft && lobby.timeLeft.startsWith('0:') && parseInt(lobby.timeLeft.split(':')[1]) <= 30
                                                        ? 'text-orange-500 font-semibold'
                                                        : 'text-muted-foreground'
                                                }`}>
                                                    {lobby.timeLeft || '5:00'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {(() => {
                                                    const currentUserName = user?.displayName || user?.email;
                                                    const isOwnLobby = lobby.creator.username === currentUserName;
                                                    
                                                    return (
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => handleJoinLobby(lobby.id)}
                                                            disabled={!user || isJoining === lobby.id || lobby.timeLeft === '0:00' || isOwnLobby}
                                                            variant={isOwnLobby ? "outline" : "default"}
                                                        >
                                                            {isJoining === lobby.id ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                                    Joining...
                                                                </>
                                                            ) : isOwnLobby ? (
                                                                <>
                                                                    <Users className="mr-2"/>
                                                                    Your Lobby
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Swords className="mr-2"/>
                                                                    Join Flip
                                                                </>
                                                            )}
                                                        </Button>
                                                    );
                                                })()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                    </Card>
                </div>
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><UserPlus className="text-primary"/> Create a Lobby</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="coinflip-bet-amount" className="text-sm font-medium">Bet Amount</label>
                                <Input 
                                    id="coinflip-bet-amount"
                                    name="coinflip-bet-amount"
                                    type="number" 
                                    placeholder="Enter amount..." 
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(e.target.value)}
                                    disabled={isPlaying}
                                />
                            </div>
                            <Tabs value={selectedSide} onValueChange={setSelectedSide} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="heads" disabled={isPlaying}>Heads</TabsTrigger>
                                    <TabsTrigger value="tails" disabled={isPlaying}>Tails</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <Button 
                                className="w-full" 
                                onClick={handleCreateLobby}
                                disabled={isPlaying || !user}
                            >
                                {isPlaying ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Playing...
                                    </>
                                ) : (
                                    'Create Coinflip Lobby'
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Plays</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                     <TableRow>
                                         <TableHead>Winner</TableHead>
                                         <TableHead>Loser</TableHead>
                                         <TableHead className="text-right">Amount</TableHead>
                                     </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                     {isLoading ? (
                                         <TableRow>
                                             <TableCell colSpan={3} className="text-center py-8">
                                                 <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                                 <p className="text-sm text-muted-foreground mt-2">Loading game history...</p>
                                             </TableCell>
                                         </TableRow>
                                     ) : recentPlaysFromHistory.length === 0 ? (
                                         <TableRow>
                                             <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                 No recent games found
                                             </TableCell>
                                         </TableRow>
                                     ) : (
                                         recentPlaysFromHistory.map(play => (
                                             <TableRow key={play.id}>
                                                 <TableCell>
                                                     {play.winner ? (
                                                         <div className="flex items-center gap-2">
                                                             <CheckCircle className="w-5 h-5 text-green-400"/>
                                                             <UserProfileLink user={{...play.winner, rank: 1}} />
                                                         </div>
                                                     ) : (
                                                         <span className="text-muted-foreground">-</span>
                                                     )}
                                                 </TableCell>
                                                 <TableCell>
                                                     {play.loser ? (
                                                         <UserProfileLink user={{...play.loser, rank: 1}} />
                                                     ) : (
                                                         <span className="text-muted-foreground">-</span>
                                                     )}
                                                 </TableCell>
                                                 <TableCell className="text-right text-yellow-400 font-mono">
                                                     {(play.amount || 0).toLocaleString()}
                                                 </TableCell>
                                             </TableRow>
                                         ))
                                     )}
                                 </TableBody>
                             </Table>
                         </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}
