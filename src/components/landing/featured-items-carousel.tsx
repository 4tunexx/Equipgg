'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from "../ui/card";
import ItemImage from "../ItemImage";
interface FeaturedItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  item_type: string;
  rarity: string;
  price: number;
  is_active: boolean;
  sort_order: number;
}

export function FeaturedItemsCarousel() {
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedItems = async () => {
      try {
        const response = await fetch('/api/landing/featured-items');
        if (response.ok) {
          const data = await response.json();
          // Filter active items and sort by sort_order
          const activeItems = data
            .filter((item: FeaturedItem) => item.is_active)
            .sort((a: FeaturedItem, b: FeaturedItem) => a.sort_order - b.sort_order);
          setFeaturedItems(activeItems);
        }
      } catch (error) {
        console.error('Failed to fetch featured items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedItems();
  }, []);

  return (
    <section>
      <div className="text-center mb-12">
        <h2 className="text-4xl font-headline font-bold">FEATURED ITEMS</h2>
      </div>
      {loading ? (
        <div className="text-center text-muted-foreground">Loading featured items...</div>
      ) : featuredItems.length === 0 ? (
        <div className="text-center text-muted-foreground">No featured items available</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featuredItems.map((item) => (
            <div key={item.id} className="p-1">
              <Card className="overflow-hidden group transition-all duration-300 ease-in-out hover:scale-105 bg-card/50 border-white/10 hover:border-primary/50">
                <CardContent className="p-0">
                  <div className="relative aspect-square">
                      <ItemImage
                        itemName={item.name}
                        itemType={item.item_type as 'skins' | 'knives' | 'gloves' | 'agents'}
                        width={300}
                        height={200}
                        className="object-cover w-full h-full"
                        fallbackSrc={item.image_url || 'https://picsum.photos/300/200?random=99'}
                      />
                  </div>
                  <div className="p-4 bg-card/70">
                    <p className="text-sm text-center text-muted-foreground">{item.name}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
