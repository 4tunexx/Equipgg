
'use client';

import { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type StatCardProps = {
  label: string;
  value: number | undefined;
  subtext?: string;
  formatAsPercent?: boolean;
};

export function StatCard({ label, value, subtext, formatAsPercent = false }: StatCardProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView && ref.current) {
      const start = 0;
      const end = value || 0;
      if (start === end) return;

      const duration = 1500;
      const startTime = Date.now();

      const animate = () => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        const currentNum = Math.floor(progress * end);
        if (ref.current) {
          ref.current.innerText = (currentNum || 0).toLocaleString() + (formatAsPercent ? '%' : '');
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          if (ref.current) {
            ref.current.innerText = (end || 0).toLocaleString() + (formatAsPercent ? '%' : '');
          }
        }
      };
      requestAnimationFrame(animate);
    }
  }, [inView, value, formatAsPercent]);

  return (
    <Card className="w-full max-w-full" ref={inViewRef}>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p ref={ref} className="text-3xl font-bold">
          {formatAsPercent ? '0%' : '0'}
        </p>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </CardContent>
    </Card>
  );
}
