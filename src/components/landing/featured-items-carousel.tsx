'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from "../ui/card";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "../ui/button";
import { rarityColors, rarityBorders, Rarity } from "../../lib/types";

interface FeaturedItem {
  id: string;
  name: string;
  description: string;
  image?: string;  // items table uses 'image' column
  type: string;
  rarity: string;
  price?: number;
  is_active: boolean;
  featured?: boolean;
}

export function FeaturedItemsCarousel() {
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 5; // Show 5 items at once

  useEffect(() => {
    const fetchFeaturedItems = async () => {
      try {
        // FETCH FROM PUBLIC ITEMS API - EXACT SAME DATA AS ADMIN PAGE
        const response = await fetch('/api/items');
        if (response.ok) {
          const data = await response.json();
          const items = data.items || [];
          
          // EXACT SAME image URL function as admin page
          const getItemImageUrl = (itemName: string, category: string) => {
            const baseUrl = 'https://www.csgodatabase.com/images';
            const categoryLower = category?.toLowerCase() || '';
            const nameLower = itemName?.toLowerCase() || '';
            
            // List of knife names that should use knives folder
            const knifeNames = ['karambit', 'bayonet', 'butterfly', 'falchion', 'flip', 'gut', 'huntsman', 
                                'bowie', 'shadow daggers', 'navaja', 'stiletto', 'ursus', 'talon', 
                                'classic knife', 'paracord', 'survival', 'nomad', 'skeleton', 'daggers'];
            
            // List of glove names that should use gloves folder
            const gloveNames = ['hand wraps', 'driver gloves', 'sport gloves', 'specialist gloves', 
                                'moto gloves', 'bloodhound gloves', 'hydra gloves', 'broken fang gloves'];
            
            // Agent names typically start with specific prefixes
            const agentPrefixes = ['agent', 'cmdr', 'lt.', 'sir', 'enforcer', 'operator', 
                                   'ground rebel', 'osiris', 'ava', 'buckshot', 'two times', 
                                   'sergeant bombson', 'chef d', "'medium rare' crasswater"];
            
            let path = 'skins';
            
            // Check if it's a knife by name or category
            if (categoryLower.includes('knife') || categoryLower === 'knives' || 
                knifeNames.some(knife => nameLower.includes(knife))) {
              path = 'knives';
            } 
            // Check if it's gloves by name or category
            else if (categoryLower.includes('glove') || categoryLower === 'gloves' || 
                     gloveNames.some(glove => nameLower.includes(glove))) {
              path = 'gloves';
            }
            // Check if it's an agent by name or category
            else if (categoryLower.includes('agent') || categoryLower === 'agents' || 
                     agentPrefixes.some(prefix => nameLower.startsWith(prefix) || nameLower.includes(prefix))) {
              path = 'agents';
            }
            
            const formattedName = itemName
              .replace(/\s*\|\s*/g, '_')
              .replace(/\s+/g, '_');
            return `${baseUrl}/${path}/webp/${formattedName}.webp`;
          };
          
          // Filter featured items or show first 10
          const featuredItems = items.filter((item: any) => item.featured);
          const itemsToShow = featuredItems.length > 0 ? featuredItems : items.slice(0, 10);
          
          const formattedItems = itemsToShow.map((item: any) => {
            // EXACT SAME priority as admin: image_url || image || generated
            const imageUrl = item.image_url || item.image || getItemImageUrl(item.name, item.type || item.category || 'Weapon');
            
            return {
              id: item.id,
              name: item.name,
              description: item.description || '',
              image: imageUrl,
              type: item.type || item.category,
              rarity: item.rarity,
              price: item.value,
              is_active: item.is_active,
              featured: item.featured
            };
          });
          
          setFeaturedItems(formattedItems);
        }
      } catch (error) {
        console.error('Failed to fetch featured items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedItems();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev + itemsPerView >= featuredItems.length ? 0 : prev + itemsPerView
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, featuredItems.length - itemsPerView) : Math.max(0, prev - itemsPerView)
    );
  };

  const visibleItems = featuredItems.slice(currentIndex, currentIndex + itemsPerView);

  return (
    <section className="py-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-headline font-bold">FEATURED ITEMS</h2>
      </div>
      {loading ? (
        <div className="text-center text-muted-foreground">Loading featured items...</div>
      ) : featuredItems.length === 0 ? (
        <div className="text-center text-muted-foreground">No featured items available</div>
      ) : (
        <div className="relative max-w-7xl mx-auto px-4">
          {/* Navigation Buttons */}
          {featuredItems.length > itemsPerView && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
                onClick={nextSlide}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Items Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {visibleItems.map((item) => {
              // Normalize rarity to capitalize first letter (database stores lowercase)
              const normalizedRarity = item.rarity 
                ? (item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1).toLowerCase()) as Rarity
                : 'Common' as Rarity;
              
              const textColor = rarityColors[normalizedRarity];
              const borderColor = rarityBorders[normalizedRarity];
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`🎨 LANDING: ${item.name} | IMAGE: ${item.image || 'none'} | RARITY: ${normalizedRarity}`);
              }
              
              return (
                <div key={item.id} className="group">
                  <Card className={`overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg bg-card/50 border-2 ${borderColor} hover:border-opacity-100`}>
                    <CardContent className="p-3">
                      <div className="relative aspect-square mb-2 rounded overflow-hidden bg-gradient-to-br from-gray-800/30 to-gray-900/30">
                        <img 
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain p-2"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.indexOf('/assets/placeholder.svg') === -1) {
                              target.src = '/assets/placeholder.svg';
                            }
                          }}
                        />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-medium line-clamp-2 min-h-[2rem]">{item.name}</p>
                        <div className="flex items-center justify-center gap-2">
                          <span className={`text-[10px] uppercase font-bold ${textColor}`}>
                            {normalizedRarity}
                          </span>
                          {item.price && (
                            <span className="text-[10px] font-bold text-yellow-500">
                              💰 {item.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {item.featured && (
                          <span className="text-[8px] font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-1 py-0.5 rounded">
                            ⭐ FEATURED
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Dots Indicator */}
          {featuredItems.length > itemsPerView && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: Math.ceil(featuredItems.length / itemsPerView) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx * itemsPerView)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    Math.floor(currentIndex / itemsPerView) === idx 
                      ? 'bg-primary w-6' 
                      : 'bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
