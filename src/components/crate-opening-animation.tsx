
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
    
    console.log('🎰 Received items for animation:', items.length, 'items');
    console.log('📦 All received items:', items.map(i => ({ name: i.name, id: i.id, rarity: i.rarity })));
    console.log('🅰️ WON ITEM DATA:', wonItem);
    console.log('🎯 WON ITEM ID:', wonItem.id, 'Type:', typeof wonItem.id);
    
    // Filter out any undefined items first
    const validItems = items.filter(item => item && item.id && item.rarity && item.image);
    
    // CRITICAL: Add won item to valid items if it's not there already
    if (validItems.length > 0 && !validItems.some(item => item.id === wonItem.id)) {
      console.log('⚠️ Won item not found in valid items! Adding it...');
      validItems.push({...wonItem});
    }
    
    console.log('✅ Valid items:', validItems.length, 'items');
    console.log('🎲 Creating reel with won item ID:', wonItem.id, 'at position:', wonItemIndex);
    
    if (validItems.length > 0) {
      // Fill the reel with random items
      for (let i = 0; i < TOTAL_REEL_ITEMS; i++) {
        if (i === wonItemIndex) {
          // GUARANTEED EXACT MATCH: Place a fresh copy of won item at target position
          // Use Object.assign to create a truly new object
          const exactWonItem: CrateItem = {
            id: wonItem.id,
            name: wonItem.name,
            type: wonItem.type,
            rarity: wonItem.rarity,
            image: wonItem.image
          };
          reel.push(exactWonItem);
          console.log('✅ Placed won item at position', i, 'ID:', exactWonItem.id, 'Name:', exactWonItem.name, 'Image:', exactWonItem.image.substring(0, 50));
        } else {
          // For all other positions, ensure we don't accidentally use the won item
          const filteredItems = validItems.filter(item => item.id !== wonItem.id);
          const itemsToUse = filteredItems.length > 0 ? filteredItems : validItems;
          const randomItem = itemsToUse[Math.floor(Math.random() * itemsToUse.length)];
          reel.push({...randomItem});
        }
      }
    } else {
      // If no valid items, just use the won item
      console.warn('⚠️ No valid items for animation, using won item only');
      for (let i = 0; i < TOTAL_REEL_ITEMS; i++) {
        reel.push({...wonItem});
      }
    }
    
    // FINAL VERIFICATION: Double-check the won item is at the correct position
    const itemAtTargetPosition = reel[wonItemIndex];
    console.log('🔍 FINAL CHECK - Item at position', wonItemIndex, ':', itemAtTargetPosition.name, 'ID:', itemAtTargetPosition.id);
    console.log('🔍 FINAL CHECK - Won item:', wonItem.name, 'ID:', wonItem.id);
    console.log('🔍 FINAL CHECK - IDs match?', itemAtTargetPosition.id === wonItem.id ? '✅ YES' : '❌ NO');
    
    if (itemAtTargetPosition.id !== wonItem.id) {
      console.error('⛔ CRITICAL MISMATCH IN REEL GENERATION!');
      // Force replace it
      reel[wonItemIndex] = {
        id: wonItem.id,
        name: wonItem.name,
        type: wonItem.type,
        rarity: wonItem.rarity,
        image: wonItem.image
      };
      console.log('🔧 FORCED REPLACEMENT at position', wonItemIndex);
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
    console.log('🏆 Won item ID:', wonItem.id, 'Name:', wonItem.name);
    
    // Log the first 5 items in the reel to verify contents
    console.log('🧩 First 5 reel items:', reelItems.slice(0, 5).map(item => ({ id: item.id, name: item.name })));
    
    // Define the won item index once here at the top of the effect
    const wonItemIndex = TOTAL_REEL_ITEMS - 10; // Position 90
    
    // CRITICAL FIX: Directly manipulate the DOM to ensure correct item is shown
    // Force the won item to be visible at the target position
    setTimeout(() => {
      try {
        // Find the target item DOM element 
        const itemElements = reelElement.querySelectorAll('.reel-item');
        const targetElement = itemElements[wonItemIndex];
        
        if (targetElement) {
          // Add a special class to highlight it visually
          targetElement.classList.add('won-item');
          
          // Set data attributes to match the won item
          targetElement.setAttribute('data-item-id', wonItem.id.toString());
          targetElement.setAttribute('data-item-name', wonItem.name);
          targetElement.setAttribute('data-item-rarity', wonItem.rarity);
          
          // Find the image element inside and force the correct image
          const imgElement = targetElement.querySelector('img');
          if (imgElement) {
            imgElement.src = wonItem.image;
            imgElement.alt = wonItem.name;
          }
          
          console.log('✅ Forced won item at position', wonItemIndex);
        } else {
          console.error('❌ Target element not found at position', wonItemIndex);
        }
      } catch (error) {
        console.error('❌ Error forcing won item:', error);
      }
    }, 50); // Short delay to ensure DOM is ready
    
    console.log('💫 ANIMATION DEBUG - CRITICAL SECTION');
    console.log('💡 Won item:', wonItem.id, wonItem.name);
    console.log('🏟 Reel item at target position:', reelItems[wonItemIndex].id, reelItems[wonItemIndex].name);
    console.log('🖼 Image URL at position:', reelItems[wonItemIndex].image.substring(0, 60));
    console.log('🖼 Won item image:', wonItem.image.substring(0, 60));
    
    // GUARANTEED MATCH CHECK - these MUST match or animation will show wrong item
    const idsMatch = reelItems[wonItemIndex].id === wonItem.id;
    const namesMatch = reelItems[wonItemIndex].name === wonItem.name;
    const imagesMatch = reelItems[wonItemIndex].image === wonItem.image;
    
    console.log(`🔎 ID Match at position ${wonItemIndex}: ${idsMatch ? '✅ YES' : '❌ NO'}`);
    console.log(`🔎 Name Match: ${namesMatch ? '✅ YES' : '❌ NO'}`);
    console.log(`🔎 Image Match: ${imagesMatch ? '✅ YES' : '❌ NO'}`);
    
    if (!idsMatch || !namesMatch) {
      console.error('⛔ CRITICAL ERROR: Won item mismatch at target position!');
      console.error('⛔ Expected:', wonItem.name, 'ID:', wonItem.id);
      console.error('⛔ Got:', reelItems[wonItemIndex].name, 'ID:', reelItems[wonItemIndex].id);
      console.error('⚠️ This WILL cause the animation to show the wrong item!');
    } else {
      console.log('👍👍👍 Animation is correctly configured to land on', wonItem.name);
    }
    
    // Reset to starting position (show items from beginning)
    reelElement.style.transition = 'none';
    reelElement.style.transform = 'translateX(0)';
    void reelElement.offsetWidth;

    // Add special highlight style to make won item really stand out
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .won-item .won-item-card {
        box-shadow: 0 0 20px 5px rgba(255, 215, 0, 0.5);
        border-color: gold;
        z-index: 100;
        transform: scale(1.05);
        transition: all 0.3s ease-in-out;
      }
      
      .won-item-card {
        position: relative;
      }
      
      .won-item-card::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 2px solid gold;
        box-shadow: 0 0 10px 2px rgba(255, 215, 0, 0.3);
        animation: pulse 1s infinite alternate;
        pointer-events: none;
      }
      
      @keyframes pulse {
        from { opacity: 0.5; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(styleEl);
    
    // CRITICAL FIX: Calculate position to center the won item EXACTLY on the indicator line
    const containerWidth = window.innerWidth;
    
    // Calculate exact pixel position to center the won item
    // wonItemIndex * REEL_ITEM_WIDTH = left edge of won item
    // + (REEL_ITEM_WIDTH / 2) = exact center of won item
    // - (containerWidth / 2) = offset to screen center
    const wonItemLeftEdge = wonItemIndex * REEL_ITEM_WIDTH;
    const wonItemCenterOffset = REEL_ITEM_WIDTH / 2; // Half item width (80px)
    const wonItemCenterPosition = wonItemLeftEdge + wonItemCenterOffset;
    const screenCenter = containerWidth / 2;
    const finalPosition = -(wonItemCenterPosition - screenCenter);
    
    // Add 0.5px compensation for sub-pixel rendering
    const compensatedPosition = Math.round(finalPosition);

    console.log('⏱️ Animation calculation:', {
      wonItemIndex,
      containerWidth,
      screenCenter,
      wonItemLeftEdge,
      wonItemCenterPosition,
      finalPosition,
      compensatedPosition,
      wonItemName: wonItem.name
    });
    console.log('🎯 Starting animation to position:', compensatedPosition, 'px (screen width:', containerWidth, 'px)');
    
    // Animate after a small delay to ensure reset is applied
    setTimeout(() => {
      reelElement.style.transition = 'transform 5s cubic-bezier(0.1, 0, 0.2, 1)';
      reelElement.style.transform = `translateX(${compensatedPosition}px)`;
    }, 100);

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
              <div 
                key={`${item.id}-${index}`} 
                className="reel-item flex-shrink-0 w-40 h-56"
                data-item-id={item.id}
                data-item-name={item.name}
                data-item-rarity={item.rarity}
              >
                <Card className={`h-full w-full flex flex-col justify-between overflow-hidden relative bg-gradient-to-br from-background/50 to-background/80 border border-border/50 ${index === TOTAL_REEL_ITEMS - 10 ? 'won-item-card ring-4 ring-yellow-500' : ''}`}>
                  <div className="p-2 flex-1 flex flex-col justify-between">
                    {/* DEBUG: Show position number */}
                    <div className="absolute top-1 left-1 bg-black/70 text-white text-[8px] px-1 rounded">
                      #{index}
                    </div>
                    {/* CRITICAL: Highlight target position */}
                    {index === TOTAL_REEL_ITEMS - 10 && (
                      <div className="absolute top-1 right-1 bg-yellow-500 text-black text-[10px] font-bold px-1 rounded">
                        TARGET
                      </div>
                    )}
                    <div className="relative h-36 w-full flex items-center justify-center">
                      <img src={item.image || fallbackImages.item} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).src = fallbackImages.item; }} />
                    </div>
                    <div className="mt-1 truncate">
                      <p className="text-sm font-bold truncate text-center leading-tight" title={item.name}>
                        {item.name}
                      </p>
                      <p className={`text-xs font-semibold text-center ${item.rarity === 'Legendary' ? 'text-yellow-500' : item.rarity === 'Exotic' ? 'text-purple-500' : item.rarity === 'Rare' ? 'text-blue-500' : item.rarity === 'Uncommon' ? 'text-green-500' : 'text-gray-500'}`}>
                        {item.rarity}
                      </p>
                      {/* DEBUG: Show item ID */}
                      <p className="text-[8px] text-gray-500 text-center">ID:{item.id}</p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
