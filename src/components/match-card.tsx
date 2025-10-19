
'use client';

import { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Separator } from "./ui/separator";
import type { MatchStatus } from "../lib/supabase/queries";

// Define Match type locally until moved to Supabase types
type Match = {
  id: string;
  team1: { name: string; logo: string; };
  team2: { name: string; logo: string; };
  startTime: string;
  status: MatchStatus;
  odds?: { team1: number; team2: number; };
  tournament?: string;
};
import { ChevronDown, Gamepad2, Gem, MapPin, Users, Clock, PlayCircle, Edit } from 'lucide-react';
import { Progress } from "./ui/progress";
import { useToast } from "../hooks/use-toast";
import { AspectRatio } from './ui/aspect-ratio';
import { useAuth } from "./auth-provider";
import { useBalance } from "../contexts/balance-context";
import { useRealtime } from "../contexts/realtime-context";
import { StreamingPlayer } from './streaming-player';
import { TeamLogo } from './team-logo';


type MatchCardProps = {
  match: Match;
  expanded: boolean;
  onToggleExpand: () => void;
  onBetPlaced?: () => void; // Callback when bet is successfully placed
};

export function MatchCard({ match, expanded, onToggleExpand, onBetPlaced }: MatchCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance, updateBalance } = useBalance();
  const { emitBetPlaced } = useRealtime();

  // State for betting
  const [betAmount, setBetAmount] = useState('');
  const [selectedBetTeam, setSelectedBetTeam] = useState<string | null>(null);
  const [hasBetted, setHasBetted] = useState(false);
  const [isEditingBet, setIsEditingBet] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  // State for voting
  const [selectedVoteTeam, setSelectedVoteTeam] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [communityVote, setCommunityVote] = useState({
    team1: 0,
    team2: 0,
    totalVotes: 0
  });
  const [isLoadingVotes, setIsLoadingVotes] = useState(true);
  const [isCastingVote, setIsCastingVote] = useState(false);

  // User balance is now handled by the global balance context

  // Fetch voting data when component mounts
  useEffect(() => {
    const fetchVotingData = async () => {
      try {
        const response = await fetch(`/api/voting/results?matchId=${match.id}`);
        const data = await response.json();
        
        if (response.ok) {
          setCommunityVote({
            team1: data.team1Percentage,
            team2: data.team2Percentage,
            totalVotes: data.totalVotes
          });
          setHasVoted(data.hasVoted);
          if (data.hasVoted && data.userVote) {
            setSelectedVoteTeam(data.userVote);
          }
        }
      } catch (error) {
        console.error('Failed to fetch voting data:', error);
      } finally {
        setIsLoadingVotes(false);
      }
    };

    fetchVotingData();
  }, [match.id]);

  const handleConfirmBet = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please sign in to place bets.',
      });
      return;
    }

    if (!selectedBetTeam || !betAmount || Number(betAmount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Bet',
        description: 'Please select a team and enter a valid bet amount.',
      });
      return;
    }

    const amount = Number(betAmount);
    
    // Check user balance
    if (!balance || amount > balance.coins) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Coins',
        description: `You need ${amount.toLocaleString()} coins but only have ${balance?.coins?.toLocaleString() || 0} coins.`,
      });
      return;
    }

    setIsPlacingBet(true);
    
    // Immediately deduct bet amount from balance for instant feedback
    if (balance) {
      updateBalance({
        coins: balance.coins - amount
      });
    }
    
    // Dispatch event to update dashboard balance immediately
    window.dispatchEvent(new CustomEvent('balanceUpdated'));
    
    try {
      // Determine team ID and odds based on selected team
      const isTeam1 = selectedBetTeam === match.team1.name;
      const teamId = isTeam1 ? match.team1.name : match.team2.name;
      const odds = isTeam1 ? (match.odds?.team1 || 1.5) : (match.odds?.team2 || 1.5);
      
      const response = await fetch('/api/betting/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId: match.id,
          // send normalized team tag to match DB check constraint ('team_a' | 'team_b')
          team: isTeam1 ? 'team_a' : 'team_b',
          teamName: teamId,
          amount: amount,
          betType: 'match_winner'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Show unlocked achievements if any
        if (data.unlockedAchievements && data.unlockedAchievements.length > 0) {
          data.unlockedAchievements.forEach((achievement: { title: string; description: string; xpReward: number }) => {
            toast({
              title: 'Achievement Unlocked!',
              description: `${achievement.title}: ${achievement.description} (+${achievement.xpReward} XP)`,
              duration: 5000,
            });
          });
        }
        
        toast({
          title: hasBetted ? 'Bet Updated!' : 'Bet Placed!',
          description: `You placed a ${amount} coin bet on ${selectedBetTeam}. Potential winnings: ${Math.floor(amount * odds)} coins!`,
        });
        
        // Update local state
        setHasBetted(true);
        setIsEditingBet(false);
        
        // Update user balance locally
        if (balance) {
          updateBalance({
            coins: data.newBalance
          });
        }
        
        // Dispatch global balance update event
        window.dispatchEvent(new CustomEvent('balanceUpdated'));
        
        // Emit Supabase Realtime event for real-time updates
        emitBetPlaced({
          userId: user?.id || '',
          username: user?.displayName || 'Anonymous',
          matchId: match.id,
          team: selectedBetTeam || '',
          amount: amount,
          timestamp: new Date().toISOString()
        });
        
        // Trigger refresh of user bets
        if (onBetPlaced) {
          onBetPlaced();
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Bet Failed',
          description: data.error || 'Failed to place bet. Please try again.',
        });
      }
    } catch (error) {
      console.error('Betting error:', error);
      toast({
        variant: 'destructive',
        title: 'Network Error',
        description: 'Failed to place bet. Please check your connection and try again.',
      });
    } finally {
      setIsPlacingBet(false);
    }
  };
  
  const handleCastVote = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please sign in to cast your vote.',
      });
      return;
    }

    if (!selectedVoteTeam) {
      toast({
        variant: 'destructive',
        title: 'No Team Selected',
        description: 'Please select a team to cast your vote.',
      });
      return;
    }

    setIsCastingVote(true);

    try {
      const response = await fetch('/api/voting/cast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId: match.id,
          prediction: selectedVoteTeam === match.team1.name ? 'team1_win' : 'team2_win',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Vote Cast!',
          description: `Your vote for ${selectedVoteTeam === 'team1' ? match.team1.name : match.team2.name} has been recorded.`,
        });
        setHasVoted(true);
        
        // Refresh voting data to show updated percentages
        const votingResponse = await fetch(`/api/voting/results?matchId=${match.id}`);
        const votingData = await votingResponse.json();
        
        if (votingResponse.ok) {
          setCommunityVote({
            team1: votingData.team1Percentage,
            team2: votingData.team2Percentage,
            totalVotes: votingData.totalVotes
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Vote Failed',
          description: data.error || 'Failed to cast vote. Please try again.',
        });
      }
    } catch (error) {
      console.error('Voting error:', error);
      toast({
        variant: 'destructive',
        title: 'Network Error',
        description: 'Failed to cast vote. Please check your connection and try again.',
      });
    } finally {
      setIsCastingVote(false);
    }
  }

  const handleEditBet = () => {
    setIsEditingBet(true);
  }

  const canEditBet = match.status === 'Upcoming';

  return (
    <Collapsible open={expanded} onOpenChange={onToggleExpand} asChild>
      <Card className="bg-card/50 hover:border-primary/50 transition-all w-full">
        <CardContent className="p-4">
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              <span>{match.tournament || 'CS2 Match'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{match.startTime}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 items-center">
            {/* Team 1 */}
            <div className="flex flex-col items-center text-center gap-2">
              <TeamLogo
                src={match.team1.logo}
                alt={match.team1.name}
                width={64}
                height={64}
                className="rounded-full bg-secondary p-2"
              />
              <span className="font-semibold text-lg">{match.team1.name}</span>
            </div>

            {/* VS and expand trigger */}
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-2xl font-bold">VS</span>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <MapPin className="w-3 h-3" />
                <span>TBD</span>
              </div>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-8 h-8 mt-4 data-[state=open]:animate-pulse"
                >
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-300 ${
                      expanded ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>

            {/* Team 2 */}
            <div className="flex flex-col items-center text-center gap-2">
              <TeamLogo
                src={match.team2.logo}
                alt={match.team2.name}
                width={64}
                height={64}
                className="rounded-full bg-secondary p-2"
              />
              <span className="font-semibold text-lg">{match.team2.name}</span>
            </div>
          </div>
        </CardContent>

        <CollapsibleContent>
          <Separator className="my-2 bg-border/50" />
            <div className="p-4 pt-2 space-y-6">
                 {/* Live Stream Player */}
                <div>
                    {'stream_url' in match && (match as Match & { stream_url?: string }).stream_url ? (
                        <StreamingPlayer 
                            streamUrl={(match as Match & { stream_url?: string }).stream_url!}
                            matchTitle={`${match.team1.name} vs ${match.team2.name}`}
                            className="w-full"
                        />
                    ) : (
                        <AspectRatio ratio={16 / 9} className="bg-secondary rounded-lg flex items-center justify-center">
                            <div className='text-center text-muted-foreground'>
                                <PlayCircle className="w-12 h-12 mx-auto" />
                                <p className='mt-2 font-semibold'>Live Stream Offline</p>
                            </div>
                        </AspectRatio>
                    )}
                </div>
                
                {/* Community Vote Progress */}
                <div className="space-y-4">
                    <p className="font-bold text-center flex items-center justify-center gap-2">
                      <Users className="w-4 h-4"/> Community Vote
                      {!isLoadingVotes && <span className="text-xs font-normal text-muted-foreground">({communityVote.totalVotes} votes)</span>}
                    </p>
                    {isLoadingVotes ? (
                      <div className="text-center text-sm text-muted-foreground">Loading votes...</div>
                    ) : (
                      <>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2">
                                    <TeamLogo src={match.team1.logo} alt={match.team1.name} width={20} height={20} className="rounded-full" />
                                    <span className="font-semibold">{match.team1.name}</span>
                                </div>
                                <span>{communityVote.team1}%</span>
                            </div>
                            <Progress value={communityVote.team1} className="h-3" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2">
                                    <TeamLogo src={match.team2.logo} alt={match.team2.name} width={20} height={20} className="rounded-full" />
                                    <span className="font-semibold">{match.team2.name}</span>
                                </div>
                                <span className="text-cyan-400">{communityVote.team2}%</span>
                            </div>
                            <Progress value={communityVote.team2} className="h-3 [&>div]:bg-cyan-400" />
                        </div>
                      </>
                    )}
                </div>
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                  {/* Betting Section */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="font-bold">Place Your Bet</p>
                      {balance && (
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                          <Gem className="w-3 h-3" />
                          Balance: {balance.coins.toLocaleString()} coins
                        </p>
                      )}
                    </div>
                    { hasBetted && !isEditingBet ? (
                      <Card className='bg-secondary/50 p-4 text-center'>
                        <p className='text-muted-foreground text-sm'>Your current bet:</p>
                        <p className='font-bold text-lg'>{betAmount} Coins on {selectedBetTeam}</p>
                        { canEditBet && (
                          <Button variant="outline" size="sm" className="mt-2" onClick={handleEditBet}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Bet
                          </Button>
                        )}
                      </Card>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant={selectedBetTeam === match.team1.name ? 'default' : 'outline'} onClick={() => setSelectedBetTeam(match.team1.name)} className="flex flex-col py-3 h-auto">
                              <span className="font-semibold">{match.team1.name}</span>
                              <span className="text-xs opacity-75">{match.odds?.team1 || 1.5}x odds</span>
                            </Button>
                            <Button variant={selectedBetTeam === match.team2.name ? 'default' : 'outline'} onClick={() => setSelectedBetTeam(match.team2.name)} className="flex flex-col py-3 h-auto">
                              <span className="font-semibold">{match.team2.name}</span>
                              <span className="text-xs opacity-75">{match.odds?.team2 || 1.5}x odds</span>
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Gem className="w-4 h-4 text-primary" />
                            <input type="number" placeholder="Bet Amount" className="w-full bg-secondary/50 p-2 rounded-md text-sm" value={betAmount} onChange={e => setBetAmount(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[10, 50, 100, 500].map(amount => (
                                <Button key={amount} variant="secondary" size="sm" onClick={() => setBetAmount(String(amount))}>{amount}</Button>
                            ))}
                        </div>
                        {selectedBetTeam && betAmount && Number(betAmount) > 0 && (
                          <div className="text-center text-sm text-muted-foreground">
                            Potential winnings: <span className="font-semibold text-primary">{Math.floor(Number(betAmount) * (selectedBetTeam === match.team1.name ? (match.odds?.team1 || 1.5) : (match.odds?.team2 || 1.5))).toLocaleString()} coins</span>
                          </div>
                        )}
                        <Button 
                          className="w-full font-bold" 
                          onClick={handleConfirmBet} 
                          disabled={!selectedBetTeam || !betAmount || Number(betAmount) <= 0 || isPlacingBet || !user}
                        >
                          {isPlacingBet ? 'Placing Bet...' : (hasBetted ? 'Update Bet' : 'Confirm Bet')}
                        </Button>
                      </>
                    )}
                  </div>
                
                  {/* Community Vote Section */}
                  { !hasVoted && (
                      <div className="space-y-4">
                          <p className="font-bold text-center flex items-center justify-center gap-2"><Users className="w-4 h-4"/> Cast Your Vote</p>
                          
                          <div className="grid grid-cols-2 gap-2">
                              <Button 
                                variant={selectedVoteTeam === 'team1' ? 'default' : 'outline'} 
                                onClick={() => setSelectedVoteTeam('team1')}
                                disabled={isCastingVote}
                              >
                                Vote {match.team1.name}
                              </Button>
                              <Button 
                                variant={selectedVoteTeam === 'team2' ? 'default' : 'outline'} 
                                onClick={() => setSelectedVoteTeam('team2')}
                                disabled={isCastingVote}
                              >
                                Vote {match.team2.name}
                              </Button>
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={handleCastVote} 
                            disabled={!selectedVoteTeam || isCastingVote || !user}
                          >
                            {isCastingVote ? 'Casting Vote...' : 'Cast Your Vote'}
                          </Button>
                      </div>
                  )}
                  {hasVoted && (
                     <div className="space-y-4 flex flex-col items-center justify-center bg-secondary/30 rounded-lg p-4">
                        <p className="font-bold text-center">Thanks for voting!</p>
                        <p className="text-sm text-muted-foreground">
                          You voted for {selectedVoteTeam === 'team1' ? match.team1.name : match.team2.name}.
                        </p>
                    </div>
                  )}
                </div>
            </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
