
'use client';

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { UserProfileLink } from '../user-profile-link';

interface LeaderboardPlayer {
  id: string;
  rank: number;
  xp: number;
  name: string;
  avatar?: string;
  dataAiHint?: string;
}

export function LeaderboardPreview() {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard');
        if (response.ok) {
          const data = await response.json();
          setPlayers(data.slice(0, 5)); // Show top 5 players
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <section>
       <div className="text-center mb-12">
        <h2 className="text-4xl font-headline font-bold">TOP PLAYERS</h2>
      </div>
      <div className="flex justify-center gap-4 md:gap-8 flex-wrap">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading top players...</p>
        ) : players.length === 0 ? (
          <p className="text-sm text-muted-foreground">No players yet.</p>
        ) : (
          players.map((player) => (
            <div key={player.id} className="flex flex-col items-center gap-2">
              <div className="relative">
                  <UserProfileLink user={{...player, avatar: player.avatar || 'https://picsum.photos/40/40?random=99', dataAiHint: player.dataAiHint || 'leaderboard player avatar'}} avatarOnly={true} />
                  <div className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground rounded-full h-8 w-8 flex items-center justify-center text-xs font-bold border-2 border-primary">
                      {player.rank}
                  </div>
              </div>
              <UserProfileLink user={{...player, avatar: player.avatar || 'https://picsum.photos/40/40?random=99', dataAiHint: player.dataAiHint || 'leaderboard player avatar'}} />
              <div className="flex items-center gap-2 text-muted-foreground">
                  <Trophy className="w-4 h-4 text-primary"/>
                  <span>{(player.xp || 0).toLocaleString?.() || '0'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
