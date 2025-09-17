'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gem, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { UserProfileLink } from "../user-profile-link";
import { toast } from 'sonner';

interface CoinflipGamePanelProps {
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
    gameResult?: {
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
    onGameComplete: (result: any) => void;
    onClose: () => void;
}

export function CoinflipGamePanel({ 
    lobbyId, 
    creator, 
    joiner, 
    betAmount, 
    creatorSide, 
    joinerSide, 
    gameResult,
    onGameComplete, 
    onClose 
}: CoinflipGamePanelProps) {
    const [gameState, setGameState] = useState<'waiting' | 'spinning' | 'result'>('waiting');
    const [countdown, setCountdown] = useState(3);
    const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null);
    const [winner, setWinner] = useState<any>(null);
    const [isSpinning, setIsSpinning] = useState(false);

    useEffect(() => {
        if (gameResult) {
            // If we have a game result, show the animation and then the result
            setGameState('waiting');
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        setGameState('spinning');
                        startCoinSpin();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [gameResult]);

    const startCoinSpin = () => {
        setIsSpinning(true);
        
        // Show spinning animation for 3 seconds, then show the actual result
        setTimeout(() => {
            if (gameResult) {
                setCoinResult(gameResult.flipResult);
                setWinner(gameResult.winner);
                setGameState('result');
                setIsSpinning(false);
                
                // Call onGameComplete with the result
                onGameComplete(gameResult);
            }
        }, 3000);
    };

    const getCoinIcon = () => {
        if (isSpinning) {
            return (
                <div className="w-32 h-32 mx-auto relative">
                    <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full border-4 border-yellow-300 shadow-2xl" 
                         style={{
                             animation: 'spin 0.1s linear infinite, pulse 0.5s ease-in-out infinite alternate'
                         }}>
                        <div className="absolute inset-2 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full flex items-center justify-center">
                            <div className="w-10 h-10 bg-yellow-600 rounded-full shadow-inner"></div>
                        </div>
                    </div>
                    <div className="absolute -inset-4 bg-yellow-400/20 rounded-full animate-ping"></div>
                </div>
            );
        }
        
        if (coinResult) {
            return (
                <div className="w-32 h-32 mx-auto relative">
                    <div className={`w-full h-full rounded-full border-4 shadow-2xl transition-all duration-500 transform hover:scale-105 ${
                        coinResult === 'heads' 
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-300' 
                            : 'bg-gradient-to-br from-yellow-600 to-yellow-800 border-yellow-400'
                    }`}>
                        <div className="absolute inset-2 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full flex items-center justify-center">
                            <div className={`w-10 h-10 rounded-full shadow-inner ${
                                coinResult === 'heads' ? 'bg-yellow-600' : 'bg-yellow-800'
                            }`}></div>
                        </div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20"></div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-yellow-900">
                        {coinResult === 'heads' ? 'H' : 'T'}
                    </div>
                </div>
            );
        }

        return (
            <div className="w-32 h-32 mx-auto relative">
                <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full border-4 border-yellow-300 shadow-2xl">
                    <div className="absolute inset-2 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full flex items-center justify-center">
                        <div className="w-10 h-10 bg-yellow-600 rounded-full shadow-inner"></div>
                    </div>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20"></div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-center text-2xl">Coinflip Game</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Players */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <UserProfileLink user={{...creator, rank: 1, xp: 0}} />
                            <Badge variant="secondary" className="mt-2 capitalize">
                                {creatorSide}
                            </Badge>
                        </div>
                        <div className="text-center">
                            <UserProfileLink user={{...joiner, rank: 1, xp: 0}} />
                            <Badge variant="secondary" className="mt-2 capitalize">
                                {joinerSide}
                            </Badge>
                        </div>
                    </div>

                    {/* Bet Amount */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-yellow-400">
                            <Gem className="w-6 h-6"/>
                            {betAmount.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Total Pot</p>
                    </div>

                    {/* Coin */}
                    <div className="text-center">
                        {gameState === 'waiting' && (
                            <div className="space-y-4">
                                <div className="text-lg font-semibold">Game starting in...</div>
                                <div className="text-4xl font-bold text-primary">{countdown}</div>
                                {getCoinIcon()}
                            </div>
                        )}
                        
                        {gameState === 'spinning' && (
                            <div className="space-y-4">
                                <div className="text-lg font-semibold">Spinning coin...</div>
                                {getCoinIcon()}
                                <div className="text-sm text-muted-foreground">Determining winner...</div>
                            </div>
                        )}
                        
                        {gameState === 'result' && (
                            <div className="space-y-4">
                                <div className="text-lg font-semibold">Result: {coinResult}</div>
                                {getCoinIcon()}
                                <div className="flex items-center justify-center gap-2">
                                    {winner ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-green-400"/>
                                            <span className="font-semibold text-green-400">
                                                {winner.name} wins!
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-5 h-5 text-red-400"/>
                                            <span className="font-semibold text-red-400">
                                                No winner
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center gap-4">
                        {gameState === 'result' && (
                            <Button onClick={onClose} className="px-8">
                                Close
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
