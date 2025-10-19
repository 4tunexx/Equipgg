'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RankDisplay } from './rank-display';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { cn } from '../lib/utils';

interface LeaderboardPlayer {
  user_id: string;
  username: string;
  avatar_url: string;
  level: number;
  xp: number;
  coins: number;
  rank: string;
}

interface LeaderboardProps {
  limit?: number;
  className?: string;
  currentUserId?: string;
}

export function Leaderboard({ limit = 100, className, currentUserId }: LeaderboardProps) {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch(`/api/leaderboard?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch leaderboard');
        
        const data = await response.json();
        setPlayers(data.players || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [limit]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🏆</span>
            <span>Leaderboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Failed to load leaderboard: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <span>Leaderboard</span>
          <span className="text-sm text-muted-foreground ml-auto">
            Top {players.length}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          {players.map((player, index) => (
            <LeaderboardEntry
              key={player.user_id}
              player={player}
              position={index + 1}
              isCurrentUser={player.user_id === currentUserId}
            />
          ))}
          
          {players.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No players on the leaderboard yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface LeaderboardEntryProps {
  player: LeaderboardPlayer;
  position: number;
  isCurrentUser?: boolean;
}

function LeaderboardEntry({ player, position, isCurrentUser }: LeaderboardEntryProps) {
  const getMedalEmoji = (pos: number) => {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return null;
  };

  const medal = getMedalEmoji(position);

  return (
    <div 
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-accent',
        isCurrentUser && 'bg-primary/10 border-2 border-primary'
      )}
    >
      {/* Position */}
      <div className="w-12 text-center font-bold">
        {medal || `#${position}`}
      </div>

      {/* Avatar */}
      <Avatar className="h-10 w-10">
        <AvatarImage src={player.avatar_url} alt={player.username} />
        <AvatarFallback>{player.username[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>

      {/* Username */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">
          {player.username}
          {isCurrentUser && (
            <span className="ml-2 text-xs text-primary">(You)</span>
          )}
        </div>
        <RankDisplay level={player.level} className="mt-1" />
      </div>

      {/* Stats */}
      <div className="text-right">
        <div className="font-bold text-lg">
          {player.xp.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground">
          Level {player.level}
        </div>
      </div>
    </div>
  );
}

interface CompactLeaderboardProps {
  limit?: number;
  className?: string;
}

export function CompactLeaderboard({ limit = 5, className }: CompactLeaderboardProps) {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch(`/api/leaderboard?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch leaderboard');
        
        const data = await response.json();
        setPlayers(data.players || []);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [limit]);

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {players.map((player, index) => (
        <div 
          key={player.user_id}
          className="flex items-center gap-2 p-2 rounded-lg bg-accent/50"
        >
          <span className="w-6 text-center font-bold text-sm">
            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
          </span>
          <Avatar className="h-8 w-8">
            <AvatarImage src={player.avatar_url} alt={player.username} />
            <AvatarFallback>{player.username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="flex-1 text-sm font-medium truncate">
            {player.username}
          </span>
          <span className="text-xs text-muted-foreground">
            Lv.{player.level}
          </span>
        </div>
      ))}
    </div>
  );
}
