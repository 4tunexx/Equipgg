
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Bomb, Diamond, Loader2 } from 'lucide-react';
import { cn } from "../../lib/utils";
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Label } from '../ui/label';
import { useAuth } from "../../hooks/use-auth";
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { UserProfileLink } from '../user-profile-link';

const GRID_SIZE = 5;

type TileState = 'hidden' | 'gem' | 'bomb';

interface GameHistoryItem {
    id: string;
    user: {
        id: string;
        name: string;
        avatar?: string;
    };
    betAmount: number;
    result?: {
        tilesRevealed?: number;
        hitBomb?: boolean;
    };
    profit: number;
}

export function SweeperGame() {
    const { user } = useAuth();
    const [grid, setGrid] = useState<TileState[][]>(
        Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('hidden'))
    );
    const [gameOver, setGameOver] = useState(false);
    const [bombs, setBombs] = useState(3);
    const [betAmount, setBetAmount] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [gameStarted, setGameStarted] = useState(false);
    const [tilesRevealed, setTilesRevealed] = useState(0);
    const [minePositions, setMinePositions] = useState<Set<string>>(new Set());
    
    useEffect(() => {
        fetchGameHistory();
    }, []);

    const fetchGameHistory = async () => {
        try {
            const response = await fetch('/api/games/history?gameType=sweeper');
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

    const generateMinePositions = (numMines: number): Set<string> => {
        const positions = new Set<string>();
        const totalTiles = GRID_SIZE * GRID_SIZE;
        
        while (positions.size < numMines && positions.size < totalTiles) {
            const row = Math.floor(Math.random() * GRID_SIZE);
            const col = Math.floor(Math.random() * GRID_SIZE);
            positions.add(`${row}-${col}`);
        }
        
        return positions;
    };

    const handleStartGame = async () => {
        if (!user) {
            toast.error('Please sign in to play');
            return;
        }

        const amount = parseFloat(betAmount);
        if (!amount || amount <= 0) {
            toast.error('Please enter a valid bet amount');
            return;
        }

        setIsPlaying(true);
        const newMinePositions = generateMinePositions(bombs);
        setMinePositions(newMinePositions);
        setGameStarted(true);
        setGameOver(false);
        setTilesRevealed(0);
        setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('hidden')));
        setIsPlaying(false);
    };

    const handleTileClick = async (row: number, col: number) => {
        if (gameOver || grid[row][col] !== 'hidden' || !gameStarted) return;
        
        const newGrid = grid.map(r => [...r]);
        const tileKey = `${row}-${col}`;
        const hitMine = minePositions.has(tileKey);
        
        if (hitMine) {
            newGrid[row][col] = 'bomb';
            setGameOver(true);
            setIsPlaying(true);
            
            // Send game over to API
            try {
                const response = await fetch('/api/games/play', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gameType: 'sweeper',
                        betAmount: parseFloat(betAmount),
                        gameData: {
                            mines: bombs,
                            revealed: tilesRevealed,
                            hitMine: true
                        }
                    })
                });
                
                const data = await response.json();
                if (response.ok) {
                    toast.error(`You hit a bomb! Lost ${parseFloat(betAmount).toLocaleString()} coins.`);
                    fetchGameHistory();
                } else {
                    toast.error(data.error || 'Game over');
                }
            } catch {
                toast.error('You hit a bomb! Game over.');
            } finally {
                setIsPlaying(false);
                setBetAmount('');
                setGameStarted(false);
            }
        } else {
            newGrid[row][col] = 'gem';
            setTilesRevealed(prev => prev + 1);
            
            // Check if player revealed enough tiles for auto-cashout
            const newTilesRevealed = tilesRevealed + 1;
            const maxSafeTiles = (GRID_SIZE * GRID_SIZE) - bombs;
            
            if (newTilesRevealed >= maxSafeTiles) {
                // Auto cash out when all safe tiles are revealed
                setTimeout(() => handleCashOut(), 100);
            }
        }
        setGrid(newGrid);
    };

    const handleCashOut = async () => {
        if (!gameStarted || gameOver) return;

        setIsPlaying(true);
        try {
            const response = await fetch('/api/games/play', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameType: 'sweeper',
                    betAmount: parseFloat(betAmount),
                    gameData: {
                        mines: bombs,
                        revealed: tilesRevealed,
                        hitMine: false
                    }
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                const profit = data.winnings - parseFloat(betAmount);
                toast.success(`Cashed out! Won ${data.winnings.toLocaleString()} coins (+${profit.toLocaleString()} profit)`);
                setBetAmount('');
                setGameStarted(false);
                fetchGameHistory();
            } else {
                toast.error(data.error || 'Failed to cash out');
            }
        } catch {
            toast.error('Failed to cash out');
        } finally {
            setIsPlaying(false);
        }
    };

    const handleReset = () => {
        setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('hidden')));
        setGameOver(false);
        setGameStarted(false);
        setTilesRevealed(0);
        setMinePositions(new Set());
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Card className="flex flex-col items-center justify-center p-6 bg-secondary/30 aspect-square">
                    <div className="grid grid-cols-5 gap-2">
                        {grid.map((row, rowIndex) =>
                            row.map((tile, colIndex) => (
                                <button
                                    key={`${rowIndex}-${colIndex}`}
                                    onClick={() => handleTileClick(rowIndex, colIndex)}
                                    className={cn(
                                        'w-20 h-20 rounded-lg flex items-center justify-center transition-all duration-300',
                                        tile === 'hidden' && 'bg-card/50 hover:bg-card',
                                        tile === 'gem' && 'bg-green-500/20 border-2 border-green-500',
                                        tile === 'bomb' && 'bg-red-500/20 border-2 border-red-500 animate-in shake',
                                    )}
                                >
                                    {tile === 'gem' && <Diamond className="w-10 h-10 text-green-400" />}
                                    {tile === 'bomb' && <Bomb className="w-10 h-10 text-red-400" />}
                                </button>
                            ))
                        )}
                    </div>
                </Card>
            </div>
             <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Sweeper Controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sweeper-bet-amount">Bet Amount</Label>
                            <Input 
                                id="sweeper-bet-amount"
                                name="sweeper-bet-amount"
                                type="number" 
                                placeholder="Enter amount..." 
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                                disabled={isPlaying || gameStarted}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Number of Bombs</Label>
                            <ToggleGroup type="single" value={String(bombs)} onValueChange={(val) => {if(val) setBombs(Number(val))}} className="grid grid-cols-4">
                                <ToggleGroupItem value="1">1</ToggleGroupItem>
                                <ToggleGroupItem value="3">3</ToggleGroupItem>
                                <ToggleGroupItem value="5">5</ToggleGroupItem>
                                <ToggleGroupItem value="10">10</ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                        {!gameStarted ? (
                            <Button 
                                className="w-full" 
                                size="lg" 
                                onClick={handleStartGame}
                                disabled={isPlaying || !user}
                            >
                                {isPlaying ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Starting...
                                    </>
                                ) : (
                                    'Start Game'
                                )}
                            </Button>
                        ) : (
                            <>
                                <Button 
                                    className="w-full" 
                                    size="lg" 
                                    onClick={handleCashOut}
                                    disabled={gameOver || isPlaying || tilesRevealed === 0}
                                >
                                    {isPlaying ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Cashing Out...
                                        </>
                                    ) : (
                                        `Cash Out (${tilesRevealed} tiles)`
                                    )}
                                </Button>
                                <Button className="w-full" variant="secondary" onClick={handleReset}>Reset Game</Button>
                            </>
                        )}

                         {gameOver && (
                            <Card className="text-center p-4 bg-red-500/10 text-red-400 mt-4">
                                <CardTitle className="text-lg">Game Over!</CardTitle>
                                <p className="text-sm">You hit a bomb! Better luck next time.</p>
                            </Card>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Games</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Player</TableHead>
                                    <TableHead>Bet</TableHead>
                                    <TableHead>Tiles Revealed</TableHead>
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
                                ) : gameHistory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No recent games found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    gameHistory.map(game => (
                                        <TableRow key={game.id}>
                                            <TableCell>
                                                <UserProfileLink user={{...game.user, rank: 1, xp: 0, avatar: game.user.avatar || '', dataAiHint: 'user avatar' }} />
                                            </TableCell>
                                            <TableCell className="font-mono text-yellow-400">{game.betAmount.toLocaleString()}</TableCell>
                                            <TableCell className="font-mono text-blue-400">{game.result?.tilesRevealed || 0}</TableCell>
                                            <TableCell className={`text-right font-mono ${game.profit > 0 ? 'text-green-400' : 'text-red-500'}`}>
                                                {game.profit > 0 ? `+${game.profit.toLocaleString()}` : game.profit.toLocaleString()}
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
