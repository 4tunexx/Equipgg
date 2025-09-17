
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gem, Rocket, Loader2 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserProfileLink } from "../user-profile-link";
import { useAuth } from '@/hooks/use-auth';
import { useBalance } from '@/contexts/balance-context';
import { toast } from 'sonner';

interface GameHistoryItem {
    id: string;
    user: {
        id: string;
        name: string;
        avatar?: string;
        role?: string;
        xp?: number;
        level?: number;
    };
    betAmount: number;
    result?: {
        cashedOutAt?: number;
    };
    profit: number;
}

type GameState = 'waiting' | 'betting' | 'playing' | 'crashed';

interface CrashDataPoint {
    time: number;
    value: number;
}

export function CrashGame() {
    const { user } = useAuth();
    const { balance, updateBalance } = useBalance();
    const [betAmount, setBetAmount] = useState('');
    const [autoCashout, setAutoCashout] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Game state management
    const [gameState, setGameState] = useState<GameState>('waiting');
    const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
    const [crashData, setCrashData] = useState<CrashDataPoint[]>([{ time: 0, value: 1.0 }]);
    const [gameTimer, setGameTimer] = useState(0);
    const [countdownTimer, setCountdownTimer] = useState(10);
    const [hasBetThisRound, setHasBetThisRound] = useState(false);
    const [cashedOut, setCashedOut] = useState(false);
    const [gameProcessed, setGameProcessed] = useState(false);
    const gameProcessedRef = useRef(false);
    const [crashPoint, setCrashPoint] = useState<number | null>(null);
    const [crashHistory, setCrashHistory] = useState<number[]>([]);
    
    useEffect(() => {
        fetchGameHistory();
    }, [user]);

    // Game loop effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (gameState === 'waiting') {
            interval = setInterval(() => {
                setCountdownTimer(prev => {
                    if (prev <= 1) {
                        setGameState('betting');
                        setCountdownTimer(5); // 5 seconds betting phase
                        setHasBetThisRound(false);
                        setCashedOut(false);
                        setGameProcessed(false);
                        gameProcessedRef.current = false;
                        setCrashPoint(null);
                        return 5;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (gameState === 'betting') {
            interval = setInterval(() => {
                setCountdownTimer(prev => {
                    if (prev <= 1) {
                        setGameState('playing');
                        setGameTimer(0);
                        setCurrentMultiplier(1.0);
                        setCrashData([{ time: 0, value: 1.0 }]);
                        // Generate crash point with weighted distribution favoring lower multipliers
                        // Use exponential distribution to make lower crashes more likely
                        const random = Math.random();
                        let randomCrash;
                        
                        if (random < 0.5) {
                            // 50% chance of crash between 1.01x - 2x
                            randomCrash = Math.random() * 0.99 + 1.01;
                        } else if (random < 0.8) {
                            // 30% chance of crash between 2x - 5x
                            randomCrash = Math.random() * 3 + 2;
                        } else if (random < 0.95) {
                            // 15% chance of crash between 5x - 10x
                            randomCrash = Math.random() * 5 + 5;
                        } else {
                            // 5% chance of crash between 10x - 20x (reduced max from 50x)
                            randomCrash = Math.random() * 10 + 10;
                        }
                        setCrashPoint(randomCrash);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (gameState === 'playing') {
            interval = setInterval(() => {
                setGameTimer(prev => {
                    const newTime = prev + 0.1;
                    // Calculate multiplier based on time (slower exponential growth)
                    // Reduced growth rate from 1.024 to 1.018 and time factor from 10 to 8
                    const multiplier = Math.pow(1.018, newTime * 8);
                    setCurrentMultiplier(multiplier);
                    
                    // Update crash data for chart
                    setCrashData(prevData => {
                        const newData = [...prevData, { time: newTime, value: multiplier }];
                        // Keep only last 50 points for performance
                        return newData.slice(-50);
                    });
                    
                    // Check if game should crash
                    if (crashPoint && multiplier >= crashPoint) {
                        setGameState('crashed');
                        setCountdownTimer(5); // 5 seconds to show crash result
                        
                        // Add to crash history using the actual crash point
                        const finalCrashPoint = crashPoint;
                        setCrashHistory(prev => [...prev, finalCrashPoint].slice(-10)); // Keep last 10 crashes
                        
                        // Process game result if player had a bet but didn't cash out
                        if (hasBetThisRound && !cashedOut && !gameProcessed && !gameProcessedRef.current) {
                            handleGameCrash();
                        }
                        
                        return newTime;
                    }
                    
                    return newTime;
                });
            }, 100); // Update every 100ms for smooth animation
        } else if (gameState === 'crashed') {
            interval = setInterval(() => {
                setCountdownTimer(prev => {
                    if (prev <= 1) {
                        setGameState('waiting');
                        setCountdownTimer(10); // 10 seconds waiting phase
                        return 10;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [gameState, crashPoint]);

    // User balance is now handled by the global balance context

    const fetchGameHistory = async () => {
        try {
            const response = await fetch('/api/games/history?gameType=crash&limit=5');
            if (response.ok) {
                const data = await response.json();
                // Remove duplicates based on game ID only
                const uniqueHistory = data.history?.filter((game: any, index: number, self: any[]) => 
                    index === self.findIndex((g: any) => g.id === game.id)
                ) || [];
                
                // Take only the latest 5 unique games
                const finalHistory = uniqueHistory.slice(0, 5);
                setGameHistory(finalHistory);
            }
        } catch (error) {
            console.error('Failed to fetch game history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlaceBet = async () => {
        if (!user) {
            toast.error('Please sign in to play');
            return;
        }

        if (gameState !== 'betting') {
            toast.error('Betting is not available right now');
            return;
        }

        const amount = parseFloat(betAmount);
        if (!amount || amount <= 0) {
            toast.error('Please enter a valid bet amount');
            return;
        }

        // Check user balance
        if (!balance || amount > balance.coins) {
            toast.error(`You need ${amount.toLocaleString()} coins but only have ${balance?.coins?.toLocaleString() || 0} coins.`);
            return;
        }

        setIsPlaying(true);
        setHasBetThisRound(true);
        
        // Immediately deduct bet amount from balance for instant feedback
        if (balance) {
            updateBalance({
                coins: balance.coins - amount
            });
        }
        
        // Dispatch event to update dashboard balance immediately
        window.dispatchEvent(new CustomEvent('balanceUpdated'));
        
        toast.success(`Bet placed: ${amount.toLocaleString()} coins`);
        setIsPlaying(false);
    };

    const handleGameCrash = async () => {
        if (!hasBetThisRound || cashedOut || isPlaying || gameProcessed || gameProcessedRef.current) {
            return;
        }

        const amount = parseFloat(betAmount);
        setGameProcessed(true);
        gameProcessedRef.current = true;
        setIsPlaying(true);
        
        try {
            const response = await fetch('/api/games/play', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameType: 'crash',
                    betAmount: amount,
                    gameData: {
                        autoCashout: null,
                        cashedOutAt: null,
                        crashedAt: crashPoint
                    }
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                toast.error(`Crashed at ${crashPoint?.toFixed(2)}x! Lost ${amount.toLocaleString()} coins`);
                setBetAmount('');
                setAutoCashout('');
                fetchGameHistory();
                // Balance updates handled by context
                
                // Dispatch events to update dashboard
                window.dispatchEvent(new CustomEvent('gameCompleted'));
                window.dispatchEvent(new CustomEvent('balanceUpdated'));
                if (data.xpGained && data.xpGained > 0) {
                    window.dispatchEvent(new CustomEvent('xpUpdated'));
                }
            } else {
                toast.error(data.error || 'Failed to process game result');
                setGameProcessed(false); // Reset game processed state on error
                gameProcessedRef.current = false; // Reset ref on error
            }
        } catch {
            toast.error('Failed to process game result');
            setGameProcessed(false); // Reset game processed state on error
            gameProcessedRef.current = false; // Reset ref on error
        } finally {
            setIsPlaying(false);
        }
    };

    const handleCashOut = async () => {
        if (!hasBetThisRound || cashedOut || gameState !== 'playing' || isPlaying) {
            return;
        }

        const amount = parseFloat(betAmount);
        // Apply house edge of 5% to reduce player winnings
        const winnings = Math.floor(amount * currentMultiplier * 0.95);
        
        // Set these states IMMEDIATELY to prevent double processing
        setCashedOut(true);
        setGameProcessed(true);
        gameProcessedRef.current = true;
        setIsPlaying(true);
        
        try {
            const response = await fetch('/api/games/play', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameType: 'crash',
                    betAmount: amount,
                    gameData: {
                        autoCashout: null,
                        cashedOutAt: currentMultiplier,
                        crashedAt: crashPoint // Send the actual crash point
                    }
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                toast.success(`Cashed out at ${currentMultiplier.toFixed(2)}x! Won ${winnings.toLocaleString()} coins`);
                setBetAmount('');
                setAutoCashout('');
                fetchGameHistory();
                // Balance updates handled by context
                
                // Dispatch events to update dashboard
                window.dispatchEvent(new CustomEvent('gameCompleted'));
                window.dispatchEvent(new CustomEvent('balanceUpdated'));
                if (data.xpGained && data.xpGained > 0) {
                    window.dispatchEvent(new CustomEvent('xpUpdated'));
                }
            } else {
                toast.error(data.error || 'Failed to cash out');
                setCashedOut(false); // Reset cashed out state on error
                setGameProcessed(false); // Reset game processed state on error
                gameProcessedRef.current = false; // Reset ref on error
            }
        } catch {
            toast.error('Failed to cash out');
            setCashedOut(false); // Reset cashed out state on error
            setGameProcessed(false); // Reset game processed state on error
            gameProcessedRef.current = false; // Reset ref on error
        } finally {
            setIsPlaying(false);
        }
    };

    const playerHistory = gameHistory.map(game => ({
        id: game.id,
        user: { 
            id: game.user.id, 
            name: game.user.name, 
            avatar: game.user.avatar,
            role: game.user.role,
            xp: game.user.xp,
            level: game.user.level
        },
        bet: game.betAmount,
        cashedOut: game.result?.cashedOutAt || null,
        profit: game.profit
    }));
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Card className="h-[450px] flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Rocket className="text-primary"/> Crash</CardTitle>
                        <CardDescription>Place a bet and cash out before the rocket crashes. The higher it goes, the bigger the multiplier!</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center bg-secondary/30 relative">
                        {/* Game Status Display */}
                        <div className="absolute top-4 left-4 z-10">
                            <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border">
                                <div className="text-sm font-medium">
                                    {gameState === 'waiting' && `Next round in ${countdownTimer}s`}
                                    {gameState === 'betting' && `Betting closes in ${countdownTimer}s`}
                                    {gameState === 'playing' && 'Game in progress'}
                                    {gameState === 'crashed' && `Crashed at ${crashPoint?.toFixed(2)}x`}
                                </div>
                            </div>
                        </div>

                        {/* Cash Out Button */}
                        {hasBetThisRound && gameState === 'playing' && !cashedOut && (
                            <div className="absolute top-4 right-4 z-10">
                                <Button 
                                    onClick={handleCashOut}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                                    size="lg"
                                >
                                    Cash Out {currentMultiplier.toFixed(2)}x
                                </Button>
                            </div>
                        )}

                        {/* Multiplier Display */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
                            {gameState === 'waiting' && (
                                <div>
                                    <p className="text-3xl font-bold font-mono text-muted-foreground">Waiting...</p>
                                    <p className="text-muted-foreground">Next round starts in {countdownTimer}s</p>
                                </div>
                            )}
                            {gameState === 'betting' && (
                                <div>
                                    <p className="text-3xl font-bold font-mono text-blue-500">Place Your Bets!</p>
                                    <p className="text-muted-foreground">Betting closes in {countdownTimer}s</p>
                                </div>
                            )}
                            {gameState === 'playing' && (
                                <div>
                                    <p className={`text-6xl font-bold font-mono ${
                                        cashedOut ? 'text-green-500' : 'text-primary'
                                    } animate-pulse`}>
                                        {currentMultiplier.toFixed(2)}x
                                    </p>
                                    {cashedOut && <p className="text-green-500 font-medium">CASHED OUT!</p>}
                                    {hasBetThisRound && !cashedOut && <p className="text-muted-foreground">Click Cash Out to secure winnings</p>}
                                </div>
                            )}
                            {gameState === 'crashed' && (
                                <div>
                                    <p className="text-5xl font-bold font-mono text-red-500 animate-pulse">{crashPoint?.toFixed(2)}x</p>
                                    <p className="text-red-500 font-medium">CRASHED!</p>
                                    <p className="text-muted-foreground">Next round in {countdownTimer}s</p>
                                </div>
                            )}
                        </div>

                        {/* Chart */}
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={crashData}>
                                <XAxis dataKey="time" hide />
                                <YAxis domain={[1, 'dataMax + 1']} hide />
                                <Tooltip 
                                    contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                                    formatter={(value: number) => [`${value.toFixed(2)}x`, 'Multiplier']}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke={gameState === 'crashed' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} 
                                    strokeWidth={3} 
                                    dot={false} 
                                    connectNulls={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Place Your Bet</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="crash-bet-amount" className="text-sm font-medium">Bet Amount</label>
                            <Input 
                                id="crash-bet-amount"
                                name="crash-bet-amount"
                                type="number" 
                                placeholder="Enter amount..." 
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                                disabled={isPlaying || gameState !== 'betting' || hasBetThisRound}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="crash-auto-cashout" className="text-sm font-medium">Auto Cashout (Optional)</label>
                             <div className="flex items-center gap-2">
                                <Rocket className="w-5 h-5 text-primary" />
                                <Input 
                                    id="crash-auto-cashout"
                                    name="crash-auto-cashout"
                                    type="number" 
                                    placeholder="e.g., 2.00" 
                                    value={autoCashout}
                                    onChange={(e) => setAutoCashout(e.target.value)}
                                    disabled={isPlaying || gameState !== 'betting' || hasBetThisRound}
                                />
                            </div>
                        </div>
                        <Button 
                            className="w-full" 
                            size="lg" 
                            onClick={handlePlaceBet}
                            disabled={isPlaying || !user || gameState !== 'betting' || hasBetThisRound}
                        >
                            {isPlaying ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Playing...
                                </>
                            ) : hasBetThisRound ? (
                                'Bet Placed'
                            ) : gameState === 'betting' ? (
                                'Place Bet'
                            ) : gameState === 'playing' ? (
                                'Round in Progress'
                            ) : gameState === 'crashed' ? (
                                'Round Ended'
                            ) : (
                                'Waiting for Next Round'
                            )}
                        </Button>
                        
                        {/* Bet Status */}
                        {hasBetThisRound && (
                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-blue-700 dark:text-blue-300">Your Bet:</span>
                                    <span className="font-medium">{betAmount} coins</span>
                                </div>
                                {autoCashout && (
                                     <div className="flex items-center justify-between text-sm mt-1">
                                         <span className="text-blue-700 dark:text-blue-300">Auto Cash Out:</span>
                                         <span className="font-medium">{autoCashout}x</span>
                                     </div>
                                 )}
                            </div>
                        )}
                        
                        {/* Last 5 Crashes */}
                        <Card className="mt-4">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-center">Last 5 Crashes</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="overflow-x-auto">
                                    <div className="flex justify-center gap-2 min-w-max px-2">
                                        {[...new Set(crashHistory)].slice(-5).map((crash, index) => (
                                            <div 
                                                key={`crash-${crash}-${index}`}
                                                className="bg-card border border-border rounded px-3 py-1.5 text-sm font-mono text-yellow-400 min-w-[50px] text-center shadow-sm flex-shrink-0"
                                            >
                                                {crash.toFixed(2)}x
                                            </div>
                                        ))}
                                        {crashHistory.length === 0 && (
                                            <div className="text-sm text-muted-foreground">No crashes yet</div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <p className="text-xs text-muted-foreground text-center">
                            {gameState === 'waiting' && 'Waiting for next round...'}
                            {gameState === 'betting' && !hasBetThisRound && 'Place your bet now!'}
                            {gameState === 'betting' && hasBetThisRound && 'Bet placed! Game starting soon...'}
                            {gameState === 'playing' && 'Game in progress...'}
                            {gameState === 'crashed' && 'Round ended. Next round starting soon...'}
                        </p>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Current Round</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Player</TableHead>
                                    <TableHead>Bet</TableHead>
                                    <TableHead>Cashed Out</TableHead>
                                    <TableHead className="text-right">Profit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                            <p className="text-sm text-muted-foreground mt-2">Loading game history...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : playerHistory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No recent games found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    playerHistory.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>
                                                <UserProfileLink user={{
                                                    ...p.user, 
                                                    rank: 1, 
                                                    xp: p.user.xp || 0, 
                                                    avatar: p.user.avatar || '', 
                                                    dataAiHint: 'user avatar', 
                                                    role: p.user.role || 'user'
                                                }} />
                                            </TableCell>
                                            <TableCell className="font-mono text-yellow-400">{p.bet.toLocaleString()}</TableCell>
                                            <TableCell className="font-mono text-primary">{p.cashedOut ? `${p.cashedOut.toFixed(2)}x` : '-'}</TableCell>
                                            <TableCell className={`text-right font-mono ${p.profit > 0 ? 'text-green-400' : 'text-red-500'}`}>
                                                {p.profit > 0 ? `+${p.profit.toLocaleString()}` : p.profit.toLocaleString()}
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
    )
}
