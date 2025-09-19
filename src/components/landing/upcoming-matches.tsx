'use client';

import { useEffect, useState } from 'react';
import Image from "next/image";
import { Card, CardContent } from "../ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { TeamLogo } from "../team-logo";

interface Team {
  name: string;
  logo: string;
  flag?: string;
  dataAiHint?: string;
}

interface Match {
  id: string;
  team1: Team;
  team2: Team;
  time: string;
}

export function UpcomingMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch('/api/matches');
        if (response.ok) {
          const data = await response.json();
          setMatches(data);
        }
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  return (
    <section>
      <div className="text-center mb-12">
        <h2 className="text-4xl font-headline font-bold">UPCOMING MATCHES</h2>
      </div>
      {loading ? (
        <div className="text-center text-muted-foreground py-8">Loading matches...</div>
      ) : matches.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No upcoming matches available</div>
      ) : (
        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {matches.map((match) => (
                <CarouselItem key={match.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="overflow-hidden group transition-all duration-300 ease-in-out hover:scale-105 bg-card/50 border-white/10 hover:border-primary/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10">
                            <TeamLogo
                              src={match.team1.logo}
                              alt={match.team1.name}
                              width={40}
                              height={40}
                              className="object-cover bg-secondary rounded-full"
                            />
                          </div>
                          <span className="font-semibold text-sm md:text-base truncate">{match.team1.name}</span>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">VS</div>
                          <div className="text-xs font-mono text-primary">{match.time}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sm md:text-base truncate">{match.team2.name}</span>
                          <div className="relative w-10 h-10">
                            <TeamLogo
                              src={match.team2.logo}
                              alt={match.team2.name}
                              width={40}
                              height={40}
                              className="object-cover bg-secondary rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                      {match.team2.flag && (
                        <div className="flex justify-center">
                          <span className="text-2xl">{match.team2.flag}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      )}
    </section>
  );
}