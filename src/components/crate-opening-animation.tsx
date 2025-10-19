
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from "../lib/utils";
import { Card } from "./ui/card";
import { rarityGlow, fallbackImages } from "../lib/constants";
import type { CrateItem } from '../types/crate';
import ItemImage from "./ItemImage";
import { Package } from 'lucide-react';

interface CrateOpeningAnimationProps {
  items: CrateItem[];
  wonItem: CrateItem;
  onAnimationEnd: () => void;
  crateImage?: string;
  crateName?: string;
}

const REEL_ITEM_WIDTH = 160; // w-40 in pixels
const TOTAL_REEL_ITEMS = 100; // Number of items in the spinning reel
const INTRO_DURATION = 1500; // Crate zoom intro duration in ms

export function CrateOpeningAnimation({ items, wonItem, onAnimationEnd, crateImage, crateName }: CrateOpeningAnimationProps) {
  const reelRef = useRef<HTMLDivElement>(null);
  const [showIntro, setShowIntro] = useState(true);

  // Memoize the reel items to prevent re-generation on re-renders
  const reelItems = useMemo(() => {
    const reel: CrateItem[] = [];
    const wonItemIndex = TOTAL_REEL_ITEMS - 10; // Land on the 90th item
    
    // Filter out any undefined items first
    const validItems = items.filter(item => item && item.id && item.rarity && item.image);
    
    console.log('🎰 Building reel with items:', validItems.length, 'valid items');
    if (validItems.length > 0) {
      console.log('📸 Sample item images:', validItems.slice(0, 3).map(i => ({ name: i.name, image: i.image })));
    }
    
    if (validItems.length === 0) {
      // If no valid items, just use the won item
      console.warn('⚠️ No valid items for animation, using won item only');
      for (let i = 0; i < TOTAL_REEL_ITEMS; i++) {
        reel.push(wonItem);
      }
    } else {
      // Cycle through ALL configured items repeatedly to fill the reel
      for (let i = 0; i < TOTAL_REEL_ITEMS; i++) {
        if (i === wonItemIndex) {
          reel.push(wonItem);
        } else {
          // Cycle through validItems array repeatedly
          const itemIndex = i % validItems.length;
          reel.push(validItems[itemIndex]);
        }
      }
    }
    
    return reel;
  }, [items, wonItem]);

  useEffect(() => {
    // Show intro for 2 seconds, then start animation
    const introTimer = setTimeout(() => {
      setShowIntro(false);
    }, 2000);

    return () => clearTimeout(introTimer);
  }, []);

  useEffect(() => {
    if (showIntro) return;

    const reelElement = reelRef.current;
    if (!reelElement) {
      console.error('❌ Reel element not found!');
      return;
    }

    console.log('🎬 Starting animation with', reelItems.length, 'items');
    
    // Reset
    reelElement.style.transition = 'none';
    reelElement.style.transform = 'translateX(0)';
    void reelElement.offsetWidth;

    // Find won item position
    const wonIndex = reelItems.findIndex(item => item.id === wonItem.id);
    console.log('🎯 Won item at index:', wonIndex);
    
    const containerWidth = window.innerWidth;
    const finalPosition = -((wonIndex * REEL_ITEM_WIDTH) - (containerWidth / 2) + (REEL_ITEM_WIDTH / 2));

    // Animate
    setTimeout(() => {
      reelElement.style.transition = 'transform 5s cubic-bezier(0.1, 0, 0.2, 1)';
      reelElement.style.transform = `translateX(${finalPosition}px)`;
    }, 50);

    const timer = setTimeout(onAnimationEnd, 5500);
    return () => clearTimeout(timer);
  }, [showIntro, reelItems, wonItem, onAnimationEnd]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden relative">
      {showIntro && crateImage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in-50 duration-1000">
          <div className="relative w-64 h-64 animate-pulse">
            <img src={crateImage} alt={crateName || "Crate"} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <p className="text-2xl font-bold text-primary mt-4 animate-pulse">Opening {crateName || "Crate"}...</p>
        </div>
      )}

      {!showIntro && (
        <div className="relative w-full h-48 flex items-center animate-in fade-in-50 duration-500">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-1 bg-primary z-20 rounded-full shadow-[0_0_15px_3px] shadow-primary" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-48 bg-gradient-to-t from-transparent via-primary/20 to-transparent z-10" />

          <div ref={reelRef} className="flex items-center absolute left-0">
            {reelItems.map((item, index) => (
              <Card key={`${item.id}-${index}`} className={cn("w-40 h-40 mx-2 flex-shrink-0 flex flex-col justify-between items-center p-2 bg-secondary/30 border-2 border-transparent", rarityGlow[item.rarity])}>
                <div className="w-24 h-24 relative flex items-center justify-center">
                  <img src={item.image || fallbackImages.item} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).src = fallbackImages.item; }} />
                </div>
                <p className="text-xs text-center truncate w-full px-1">{item.name}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
