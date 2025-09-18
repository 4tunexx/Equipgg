

 
'use client';
 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Gem, Award, Star, BrainCircuit, Handshake, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { UserProfileLink } from '@/components/user-profile-link';
import { useEffect, useState } from 'react';
import { getRoleColors } from '@/lib/role-colors';


export default function LeaderboardPage() {
    const [leaderboardData, setLeaderboardData] = useState<{id: number; name: string; avatar: string; coins: number; xp: number; level: number; wins: number; winRate: number; rank: number; role?: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getTrophyColor = (rank: number) => {
        if (rank === 1) return 'text-yellow-400';
        if (rank === 2) return 'text-gray-400';
        if (rank === 3) return 'text-yellow-600';
        return 'text-muted-foreground';
    }

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/leaderboard');
                if (response.ok) {
                    const data = await response.json();
                    setLeaderboardData(data);
                } else {
                    setError('Failed to fetch leaderboard data');
                }
            } catch (err) {
                setError('Error loading leaderboard');
                console.error('Leaderboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const renderLeaderboardTable = (data: {id: number; name: string; avatar: string; coins: number; xp: number; level: number; wins: number; winRate: number; rank: number}[], type: string) => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading leaderboard...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
            );
        }

        if (data.length === 0) {
            return (
                <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No players found.</p>
                </div>
            );
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead className="text-right">
                            {type === 'xp' ? 'XP' : type === 'coins' ? 'Coins' : 'Score'}
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((player) => (
                        <TableRow key={player.id}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Trophy className={cn("h-4 w-4", getTrophyColor(player.rank))} />
                                    <span className="font-semibold">{player.rank}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <UserProfileLink user={{...player, id: player.id.toString(), role: (player as any).role || 'player', dataAiHint: `Player ${player.name} - Level ${player.level}`}} />
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary">Level {player.level}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                                {type === 'xp' ? player.xp?.toLocaleString() : 
                                 type === 'coins' ? `${player.coins?.toLocaleString() || 0} coins` :
                                 (player.wins || 0).toLocaleString()}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="xp" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className='grid grid-cols-5 w-full max-w-2xl'>
                <TabsTrigger value="xp">
                    <Star className="mr-2 h-4 w-4" />
                    Top XP
                </TabsTrigger>
                <TabsTrigger value="coins">
                     <Gem className="mr-2 h-4 w-4" />
                    Most Coins
                </TabsTrigger>
                <TabsTrigger value="achievements">
                     <Award className="mr-2 h-4 w-4" />
                    Achievements
                </TabsTrigger>
                 <TabsTrigger value="predictors">
                     <BrainCircuit className="mr-2 h-4 w-4" />
                    Top Predictors
                </TabsTrigger>
                 <TabsTrigger value="contributors">
                     <Handshake className="mr-2 h-4 w-4" />
                    Contributors
                </TabsTrigger>
            </TabsList>
          </div>
            
            <TabsContent value="xp">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Players by XP</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderLeaderboardTable(leaderboardData, 'xp')}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="coins">
                <Card>
                    <CardHeader>
                        <CardTitle>Most Coins Won</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderLeaderboardTable(leaderboardData, 'coins')}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="achievements">
                 <Card>
                    <CardHeader>
                        <CardTitle>Top Achievements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderLeaderboardTable(leaderboardData, 'achievements')}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="predictors">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Predictors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderLeaderboardTable(leaderboardData, 'predictors')}
                    </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="contributors">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Contributors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderLeaderboardTable(leaderboardData, 'contributors')}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
