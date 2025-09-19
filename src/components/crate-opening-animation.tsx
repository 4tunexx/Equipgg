
'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { cn } from "../lib/utils";
import { Card } from "./ui/card";
import { rarityGlow, fallbackImages } from "../lib/constants";
import type { CrateItem } from '../types/crate';
import ItemImage from "./ItemImage";

interface CrateOpeningAnimationProps {
  items: CrateItem[];
  wonItem: CrateItem;
  onAnimationEnd: () => void;
}

const REEL_ITEM_WIDTH = 160; // w-40 in pixels
const TOTAL_REEL_ITEMS = 100; // Number of items in the spinning reel

export function CrateOpeningAnimation({ items, wonItem, onAnimationEnd }: CrateOpeningAnimationProps) {
  const reelRef = useRef<HTMLDivElement>(null);

  // Memoize the reel items to prevent re-generation on re-renders
  const reelItems = useMemo(() => {
    const reel = [];
    const wonItemIndex = TOTAL_REEL_ITEMS - 10; // Land on the 90th item
    
    // Create a deterministic seed based on wonItem.id
    const seed = parseInt(wonItem.id.replace(/\D/g, '')) || 0;
    
    // Populate the reel with deterministic pseudo-random items
    for (let i = 0; i < TOTAL_REEL_ITEMS; i++) {
      if (i === wonItemIndex) {
        reel.push(wonItem);
      } else {
        // Use a simple deterministic "random" based on position and seed
        const pseudoRandom = (seed + i * 17) % items.length;
        reel.push(items[pseudoRandom]);
      }
    }
    
    return reel;
  }, [items, wonItem]);

  useEffect(() => {
    const reelElement = reelRef.current;
    if (!reelElement) return;

    // Reset scroll position
    reelElement.style.transition = 'none';
    reelElement.scrollLeft = 0;

    // Start animation after a short delay
    requestAnimationFrame(() => {
      reelElement.style.transition = 'scroll-left 4s cubic-bezier(0.2, 0.5, 0.3, 1)';
      reelElement.scrollLeft = (TOTAL_REEL_ITEMS - 10) * REEL_ITEM_WIDTH;
    });

    // Call onAnimationEnd after animation completes
    const timer = setTimeout(onAnimationEnd, 4500);
    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  return (
    <div className="w-full overflow-hidden">
      <div className="relative w-full">
        {/* Indicator line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary z-10" />
        
        {/* Reel container */}
        <div 
          ref={reelRef}
          className="flex gap-1 md:gap-2 overflow-x-hidden scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch' } as const}
        >
          <div className="flex gap-1 md:gap-2">
            {reelItems.map((item, index) => (
              <Card 
                key={`${item.id}-${index}`} 
                className={cn(
                  "w-24 h-24 md:w-40 md:h-40 shrink-0 flex items-center justify-center overflow-hidden p-1 md:p-2",
                  rarityGlow[item.rarity]
                )}
              >
                <Image
                  src={item.image || fallbackImages.item}
                  alt={item.name}
                  width={150}
                  height={150}
                  className="object-contain"
                  priority
                />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    // We're driving the animation with JS now
    const reelElement = reelRef.current;
    if (!reelElement) return;

    // Reset scroll position
    reelElement.style.transition = 'none';
    reelElement.style.transform = 'translateX(0)';
    
    // Force a reflow to apply the reset styles immediately
    void reelElement.offsetWidth;

    // Calculate the final position to land on the winning item
    const wonItemIndex = reelItems.findIndex(item => item.id === wonItem.id && item.name === wonItem.name);
    // Center the winning item in the view. Adjust by half the container width minus half item width.
    const containerWidth = reelElement.parentElement?.clientWidth || 0;
    // Use deterministic jitter based on wonItem.id instead of Math.random()
    const seed = wonItem.id.charCodeAt(wonItem.id.length - 1) || 0;
    const deterministicJitter = ((seed % 100) - 50) * (REEL_ITEM_WIDTH * 0.006); // Reduced jitter
    const finalPosition = -((wonItemIndex * REEL_ITEM_WIDTH) - (containerWidth / 2) + (REEL_ITEM_WIDTH / 2) + deterministicJitter);

    // Set the transition and final transform
    reelElement.style.transition = 'transform 7s cubic-bezier(0.1, 0, 0.2, 1)';
    reelElement.style.transform = `translateX(${finalPosition}px)`;

    // Set a timeout for the animation duration
    const animationTimer = setTimeout(() => {
      onAnimationEnd();
    }, 7500); // Slightly longer than the transition to be safe

    return () => clearTimeout(animationTimer);
  }, [reelItems, wonItem, onAnimationEnd]);
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <div className="relative w-full h-48 flex items-center">
        {/* The center marker/ticker */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-1 bg-primary z-20 rounded-full shadow-[0_0_15px_3px] shadow-primary" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-48 bg-gradient-to-t from-transparent via-primary/20 to-transparent z-10" />

        {/* The reel itself */}
        <div
          ref={reelRef}
          className="flex items-center absolute left-0"
        >
          {reelItems.map((item, index) => (
            <Card key={`${item.id}-${index}`} className={cn("w-40 h-40 mx-2 flex-shrink-0 flex flex-col justify-between items-center p-2 bg-secondary/30 border-2 border-transparent", rarityGlow[item.rarity])}>
              <div className="w-24 h-24 relative">
                  <ItemImage
                    itemName={item.name}
                    itemType={item.type as 'skins' | 'knives' | 'gloves' | 'agents'}
                    width={96}
                    height={96}
                    className="object-contain"
                  />
              </div>
              <p className="text-xs text-center truncate w-full px-1">{item.name}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
