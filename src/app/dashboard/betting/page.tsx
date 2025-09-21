
'use client';

import { useState, useEffect } from 'react';
import { useRealtimeBetting } from "../../../hooks/use-realtime-betting";
import { MatchCard } from "../../../components/match-card";
import { LiveChat } from "../../../components/live-chat";
import { YourBets } from "../../../components/your-bets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Button } from '../../../components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';

// Local type definition for MatchStatus
type MatchStatus = 'Upcoming' | 'Live' | 'Finished';

interface Team {
  name: string;
  logo: string;
  dataAiHint: string;
}

interface Match {
  id: string;
  team1: Team;
  team2: Team;
  odds1: number;
  odds2: number;
  startTime: string;
  status: MatchStatus;
}

interface ApiMatch {
  id: string;
  team1: Team;
  team2: Team;
  time: string;
  status: string;
  stream_url?: string;
  tournament?: string;
}

export default function BettingPage() {
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [betsRefreshTrigger, setBetsRefreshTrigger] = useState(0);
  
  // Initialize real-time betting
  const { isConnected } = useRealtimeBetting();

  // Separate matches by status
  const upcomingMatches = matches.filter(m => m.status === 'Upcoming');
  const liveMatches = matches.filter(m => m.status === 'Live');
  const finishedMatches = matches.filter(m => m.status === 'Finished');
  const allMatches = matches;

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch('/api/matches');
        if (response.ok) {
          const apiMatches = await response.json();
          // Convert API matches to match our expected format
          const formattedMatches = apiMatches.map((match: ApiMatch) => {
             // Generate more realistic odds that are inversely related
             const baseOdds1 = 1.5 + Math.random() * 1.0; // Between 1.5-2.5
             const baseOdds2 = 3.0 - baseOdds1 + 0.5; // Inversely related, between 1.0-2.0
             
             return {
               ...match,
               odds1: Math.round(baseOdds1 * 100) / 100, // Round to 2 decimal places
               odds2: Math.round(baseOdds2 * 100) / 100,
               startTime: match.time,
               status: match.status === 'upcoming' ? 'Upcoming' : match.status
             };
           });
          setMatches(formattedMatches);
        }
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleToggleExpand = (matchId: string) => {
    setActiveMatchId(prevId => (prevId === matchId ? null : matchId));
  };

  const handleBetPlaced = () => {
    // Trigger refresh of YourBets component
    setBetsRefreshTrigger(prev => prev + 1);
  };


  const loadTestMatches = async () => {
    try {
      const response = await fetch('/api/matches/test', {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        // Refresh matches after adding test data
        const matchesResponse = await fetch('/api/matches');
        if (matchesResponse.ok) {
          const apiMatches = await matchesResponse.json();
          const formattedMatches = apiMatches.map((match: ApiMatch) => {
            const baseOdds1 = 1.5 + Math.random() * 1.0;
            const baseOdds2 = 3.0 - baseOdds1 + 0.5;
            
            return {
              ...match,
              odds1: Math.round(baseOdds1 * 100) / 100,
              odds2: Math.round(baseOdds2 * 100) / 100,
              startTime: match.time,
              status: match.status === 'upcoming' ? 'Upcoming' : match.status
            };
          });
          setMatches(formattedMatches);
        }
      }
    } catch (error) {
      console.error('Failed to load test matches:', error);
    }
  };

  const renderMatches = (matchList: Match[]) => {
    if (loading) {
      return <p className="text-sm text-muted-foreground">Loading matches...</p>;
    }
    
    return (
      <div className="flex flex-col gap-4">
        {matchList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matches yet.</p>
        ) : (
          matchList.map((match) => (
            <MatchCard 
              key={match.id} 
              match={match} 
              expanded={activeMatchId === match.id} 
              onToggleExpand={() => handleToggleExpand(match.id)} 
              onBetPlaced={handleBetPlaced}
            />
          ))
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 h-full">
      <main className="lg:col-span-3 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Header with Load Test Matches Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">CS2 Betting</h1>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              isConnected 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              {isConnected ? 'Live Updates' : 'Offline'}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadTestMatches} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Load Test Matches
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>


        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="finished">Finished</TabsTrigger>
            <TabsTrigger value="all">All Matches</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-6">
            {renderMatches(upcomingMatches)}
          </TabsContent>
          <TabsContent value="live" className="mt-6">
            {renderMatches(liveMatches)}
          </TabsContent>
          <TabsContent value="finished" className="mt-6">
             {renderMatches(finishedMatches)}
          </TabsContent>
          <TabsContent value="all" className="mt-6">
             {renderMatches(allMatches)}
          </TabsContent>
        </Tabs>

        <div className="mt-12">
            <YourBets refreshTrigger={betsRefreshTrigger} />
        </div>
      </main>
      <aside className="lg:col-span-1 border-l bg-card/50 flex flex-col">
  <LiveChat title="Match Chat" lobby="betting" />
      </aside>
    </div>
  );
}
