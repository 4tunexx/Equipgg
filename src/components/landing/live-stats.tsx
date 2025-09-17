"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

const StatCard = ({ value, label }: { value: number | undefined; label: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView && ref.current) {
      const start = 0;
      const end = value || 0;
      if (start === end) return;

      const duration = 2000;
      const startTime = Date.now();

      const animate = () => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        const currentNum = Math.floor(progress * end);
        if(ref.current) {
            ref.current.innerText = (currentNum || 0).toLocaleString();
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
            if(ref.current) {
                ref.current.innerText = (end || 0).toLocaleString();
            }
        }
      };
      requestAnimationFrame(animate);
    }
  }, [inView, value]);

  return (
    <div className="flex flex-col items-center gap-2" ref={inViewRef}>
        <span
          ref={ref}
          className="text-5xl font-bold font-headline tabular-nums text-primary"
        >
          0
        </span>
        <p className="text-muted-foreground tracking-widest text-sm">{label}</p>
    </div>
  );
};

export function LiveStats() {
  const [stats, setStats] = useState([
    {
      value: 0,
      label: "USERS ONLINE",
    },
    {
      value: 0,
      label: "TOTAL COINS",
    },
    {
      value: 0,
      label: "TOTAL BETS",
    },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats([
            {
              value: data.usersOnline || 0,
              label: "USERS ONLINE",
            },
            {
              value: data.totalCoins || 0,
              label: "TOTAL COINS",
            },
            {
              value: data.totalBets || 0,
              label: "TOTAL BETS",
            },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}