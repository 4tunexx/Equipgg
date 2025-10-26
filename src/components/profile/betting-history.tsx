'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { useEffect, useState } from 'react';
import Image from "next/image";

interface BettingHistoryItem {
    id: string;
    matchTitle: string;
    betAmount: number;
    odds: number;
    potentialWin: number;
    status: 'won' | 'lost' | 'pending';
    timestamp: string;
    match: {
        team1: { name: string; logo: string; dataAiHint: string };
        team2: { name: string; logo: string; dataAiHint: string };
    };
    team: { name: string; logo: string; dataAiHint: string };
    amount: number;
    potentialWinnings: number;
}

export function BettingHistory() {
    const [bettingHistory, setBettingHistory] = useState<BettingHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBettingHistory();
    }, []);

    const fetchBettingHistory = async () => {
        try {
            const response = await fetch('/api/betting/user-bets');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.bets) {
                    // Transform API data to match component interface
                    const transformedBets = data.bets.map((bet: any) => ({
                        id: bet.id,
                        matchTitle: bet.match_title || `${bet.team1_name} vs ${bet.team2_name}`,
                        betAmount: bet.bet_amount,
                        odds: bet.odds,
                        potentialWin: bet.potential_winnings,
                        status: bet.status === 'completed' ? (bet.won ? 'won' : 'lost') : 'pending',
                        timestamp: bet.created_at,
                        match: {
                            team1: { 
                                name: bet.team1_name || 'Team 1', 
                                logo: bet.team1_logo || '/assets/placeholder.svg',
                                dataAiHint: `${bet.team1_name || 'Team 1'} logo`
                            },
                            team2: { 
                                name: bet.team2_name || 'Team 2', 
                                logo: bet.team2_logo || '/assets/placeholder.svg',
                                dataAiHint: `${bet.team2_name || 'Team 2'} logo`
                            }
                        },
                        team: {
                            name: bet.bet_team_name || bet.team1_name || 'Team',
                            logo: bet.bet_team_logo || bet.team1_logo || '/assets/placeholder.svg',
                            dataAiHint: `${bet.bet_team_name || bet.team1_name || 'Team'} logo`
                        },
                        amount: bet.bet_amount,
                        potentialWinnings: bet.potential_winnings
                    }));
                    setBettingHistory(transformedBets);
                }
            }
        } catch (error) {
            console.error('Failed to fetch betting history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Betting History</CardTitle>
                    <CardDescription>A log of your past and active bets.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Loading betting history...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Betting History</CardTitle>
                <CardDescription>A log of your past and active bets.</CardDescription>
            </CardHeader>
            <CardContent>
                {bettingHistory.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">No betting history found</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Start placing bets to see your history here
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Match</TableHead>
                                <TableHead>Your Pick</TableHead>
                                <TableHead className="text-right">Bet Amount</TableHead>
                                <TableHead className="text-right">Winnings</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bettingHistory.map((bet) => (
                                <TableRow key={bet.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-xs">
                                            <Image src={bet.match.team1.logo} alt={bet.match.team1.name} width={20} height={20} data-ai-hint={bet.match.team1.dataAiHint} />
                                            <span>{bet.match.team1.name}</span>
                                            vs
                                            <Image src={bet.match.team2.logo} alt={bet.match.team2.name} width={20} height={20} data-ai-hint={bet.match.team2.dataAiHint} />
                                            <span>{bet.match.team2.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Image src={bet.team.logo} alt={bet.team.name} width={24} height={24} data-ai-hint={bet.team.dataAiHint} />
                                            <span className="font-semibold">{bet.team.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{bet.amount.toLocaleString()}</TableCell>
                                    <TableCell className={cn("text-right font-mono", bet.status === 'won' ? 'text-green-400' : 'text-primary')}>
                                        {bet.status === 'lost' ? '-' : bet.potentialWinnings.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={
                                            bet.status === 'pending' ? 'secondary' :
                                            bet.status === 'won' ? 'default' : 'destructive'
                                        } className={cn(bet.status === 'won' && 'bg-green-600')}>{bet.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}