
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Temporary betting history data - TODO: move to Supabase
const bettingHistoryData = [
  {
    id: '1',
    matchTitle: 'FaZe vs NAVI',
    betAmount: 100,
    odds: 1.85,
    potentialWin: 185,
    status: 'won' as const,
    timestamp: '2024-01-15T10:30:00Z'
  }
];
import Image from "next/image";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";


export function BettingHistory() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Betting History</CardTitle>
                <CardDescription>A log of your past and active bets.</CardDescription>
            </CardHeader>
            <CardContent>
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
                        {bettingHistoryData.map((bet) => (
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
                                <TableCell className={cn("text-right font-mono", bet.status === 'Won' ? 'text-green-400' : 'text-primary')}>
                                    {bet.status === 'Lost' ? '-' : bet.potentialWinnings.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={
                                        bet.status === 'Active' ? 'secondary' :
                                        bet.status === 'Won' ? 'default' : 'destructive'
                                    } className={cn(bet.status === 'Won' && 'bg-green-600')}>{bet.status}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
