
'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
// Define Bet type locally until moved to Supabase types
type Bet = {
  id: string;
  matchTitle: string;
  team: {
    name: string;
    logo: string;
    dataAiHint: string;
  };
  amount: number;
  odds: number;
  potentialWin: number;
  potentialWinnings: number;
  status: 'pending' | 'won' | 'lost';
  timestamp: string;
  match: {
    team1: { name: string; logo: string; dataAiHint: string; };
    team2: { name: string; logo: string; dataAiHint: string; };
  };
};
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import { useAuth } from "./auth-provider";
import { Loader2 } from 'lucide-react';

type YourBetsProps = {
  refreshTrigger?: number; // Optional prop to trigger refresh
};

export function YourBets({ refreshTrigger }: YourBetsProps) {
  const { user } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserBets = async () => {
      if (!user) {
        setBets([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/betting/user-bets', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setBets(data.bets || []);
          // Don't log error if it's just the feature being unavailable
          if (data.message && data.message.includes('not yet available')) {
            console.log('Betting feature not yet available:', data.message);
          }
        } else {
          console.error('Failed to fetch user bets - HTTP', response.status);
          setBets([]);
        }
      } catch (error) {
        console.error('Error fetching user bets:', error);
        setBets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserBets();
  }, [user, refreshTrigger]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Bets</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Loading your bets...</span>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Bets</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          Please sign in to view your bets.
        </CardContent>
      </Card>
    );
  }

  if (bets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Bets</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          You haven't placed any bets yet.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Bets</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Match</TableHead>
              <TableHead>Your Pick</TableHead>
              <TableHead className="text-right">Bet Amount</TableHead>
              <TableHead className="text-right">Potential Winnings</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bets.map((bet) => (
              <TableRow key={bet.id}>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs">
                    <Image src={bet.match.team1.logo} alt={bet.match.team1.name} width={20} height={20} data-ai-hint={bet.match.team1.dataAiHint} />
                    vs
                    <Image src={bet.match.team2.logo} alt={bet.match.team2.name} width={20} height={20} data-ai-hint={bet.match.team2.dataAiHint} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Image src={bet.team.logo} alt={bet.team.name} width={24} height={24} data-ai-hint={bet.team.dataAiHint} />
                    <span className="font-semibold">{bet.team.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">{bet.amount.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-primary">{bet.potentialWinnings.toLocaleString()}</TableCell>
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
      </CardContent>
    </Card>
  );
}
