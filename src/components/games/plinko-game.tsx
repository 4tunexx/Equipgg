
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAuth } from "../../hooks/use-auth";
import { useBalance } from "../../contexts/balance-context";
import { toast } from 'sonner';

interface GameHistoryItem {
    id: string;
    user_id: string;
    game_type: string;
    bet_amount: number;
    winnings: number;
    profit: number;
    multiplier?: number;
    game_data: string;
    result: string;
    tiles_cleared: number;
    xp_gained: number;
    created_at: string;
}

const BUCKETS = 12;
const BUCKET_MULTIPLIERS = [0.2, 0.5, 1.0, 1.5, 2.0, 5.0, 10.0, 2.0, 1.5, 1.0, 0.5, 0.2];

export function PlinkoGame() {
    const { user } = useAuth();
    const { balance, updateBalance } = useBalance();
    const [betAmount, setBetAmount] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [ballPosition, setBallPosition] = useState<number | null>(null);
    const [bucketResult, setBucketResult] = useState<number | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        fetchGameHistory();
    }, []);

    const fetchGameHistory = async () => {
        try {
            const response = await fetch('/api/games/history?gameType=plinko');
            if (response.ok) {
                const data = await response.json();
                setGameHistory(data.history || []);
            }
        } catch (error) {
            console.error('Failed to fetch game history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const simulateBallDrop = (bucketIndex: number): Promise<void> => {
        return new Promise((resolve) => {
            setIsAnimating(true);
            setBallPosition(0);
            
            // Simulate ball bouncing down the pegs
            let currentPosition = 0;
            const totalSteps = 8; // Number of peg rows
            const stepDelay = 150; // ms between steps
            
            const animateStep = (step: number) => {
                if (step < totalSteps) {
                    // Add some randomness to the path
                    const randomOffset = (Math.random() - 0.5) * 0.3;
                    currentPosition += randomOffset;
                    
                    setBallPosition(currentPosition);
                    setTimeout(() => animateStep(step + 1), stepDelay);
                } else {
                    // Final position
                    setBallPosition(bucketIndex);
                    setIsAnimating(false);
                    resolve();
                }
            };
            
            animateStep(0);
        });
    };

    const handlePlay = async () => {
        if (!user) {
            toast.error('Please log in to play');
            return;
        }

        const amount = parseFloat(betAmount);
        if (!amount || amount <= 0) {
            toast.error('Please enter a valid bet amount');
            return;
        }

        if (balance && amount > (balance as any).coins) {
            toast.error('Insufficient balance');
            return;
        }

        setIsPlaying(true);
        setBucketResult(null);
        setBallPosition(null);

        try {
            // Generate random bucket result
            const bucketIndex = Math.floor(Math.random() * BUCKETS);
            const multiplier = BUCKET_MULTIPLIERS[bucketIndex];
            const winnings = Math.floor(amount * multiplier);

            // Animate ball drop
            await simulateBallDrop(bucketIndex);
            setBucketResult(bucketIndex);

            // Send game result to API
            const response = await fetch('/api/games/play', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameType: 'plinko',
                    betAmount: amount,
                    gameData: {
                        bucketIndex,
                        multiplier,
                        winnings
                    }
                })
            });

            const data = await response.json();

            if (data.success) {
                updateBalance(data.game.newBalance);
                
                if (data.game.won) {
                    toast.success(`Ball landed in bucket ${bucketIndex + 1}! Won ${winnings} coins!`);
                } else {
                    toast.error(`Ball landed in bucket ${bucketIndex + 1}. Lost ${amount} coins.`);
                }

                // Refresh game history
                fetchGameHistory();
            } else {
                toast.error(data.error || 'Game failed');
            }
        } catch (error) {
            console.error('Game error:', error);
            toast.error('Game failed. Please try again.');
        } finally {
            setIsPlaying(false);
        }
    };

    const renderPegs = () => {
        const rows = 8;
        const pegs: JSX.Element[] = [];
        
        for (let row = 0; row < rows; row++) {
            const pegsInRow = row + 1;
            for (let peg = 0; peg < pegsInRow; peg++) {
                pegs.push(
                    <div
                        key={`${row}-${peg}`}
                        className="w-2 h-2 bg-gray-400 rounded-full absolute"
                        style={{
                            left: `${50 + (peg - pegsInRow / 2) * 8}%`,
                            top: `${20 + row * 8}%`,
                        }}
                    />
                );
            }
        }
        
        return pegs;
    };

    const renderBuckets = () => {
        return BUCKET_MULTIPLIERS.map((multiplier, index) => (
            <div
                key={index}
                className={`w-8 h-12 border-2 rounded-b-lg flex items-end justify-center text-xs font-bold ${
                    bucketResult === index 
                        ? 'border-yellow-400 bg-yellow-100 dark:bg-yellow-900' 
                        : 'border-gray-300 bg-gray-100 dark:bg-gray-800'
                }`}
                style={{ marginLeft: `${index * 7}%` }}
            >
                <span className="text-xs">{multiplier}x</span>
            </div>
        ));
    };

    const renderBall = () => {
        if (ballPosition === null) return null;
        
        return (
            <div
                className="w-4 h-4 bg-red-500 rounded-full absolute transition-all duration-150 ease-out z-10"
                style={{
                    left: `${50 + ballPosition * 7}%`,
                    top: `${20 + (ballPosition * 0.5)}%`,
                }}
            />
        );
    };

    return (
        <div className="space-y-6">
            {/* Game Board */}
            <Card>
                <CardHeader>
                    <CardTitle>Plinko Game</CardTitle>
                    <CardDescription>
                        Drop the ball and watch it bounce down to win multipliers!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative h-96 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg overflow-hidden">
                        {/* Pegs */}
                        {renderPegs()}
                        
                        {/* Ball */}
                        {renderBall()}
                        
                        {/* Buckets */}
                        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                            {renderBuckets()}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Betting Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Place Your Bet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <Input
                            type="number"
                            placeholder="Bet amount"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            disabled={isPlaying}
                            className="flex-1"
                        />
                        <Button
                            onClick={handlePlay}
                            disabled={isPlaying || !betAmount}
                            className="px-8"
                        >
                            {isPlaying ? 'Playing...' : 'Drop Ball'}
                        </Button>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                        <p>Current Balance: {balance ? (balance as any).coins : 0} coins</p>
                        <p>Multipliers: 0.2x to 10x</p>
                    </div>
                </CardContent>
            </Card>

            {/* Game History */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Games</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p>Loading game history...</p>
                    ) : gameHistory.length === 0 ? (
                        <p className="text-muted-foreground">No games played yet</p>
                    ) : (
                        <div className="space-y-2">
                            {gameHistory.slice(0, 10).map((game) => {
                                const gameData = JSON.parse(game.game_data || '{}');
                                return (
                                    <div key={game.id} className="flex justify-between items-center p-2 bg-muted rounded">
                                        <div>
                                            <span className="font-medium">Bucket {gameData.bucketIndex + 1}</span>
                                            <span className="text-muted-foreground ml-2">
                                                {gameData.multiplier}x multiplier
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold ${game.winnings > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {game.winnings > 0 ? '+' : ''}{game.winnings} coins
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(game.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}