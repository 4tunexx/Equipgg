
'use client';

'use client';

import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Coins, ShoppingCart, Loader2 } from 'lucide-react';
import type { Rarity as QueryRarity } from "../lib/supabase/queries";
import { ShopItem } from '../types/shop';
import { cn } from "../lib/utils";
import { rarityColors, rarityBorders, rarityGradients, rarityGlow, Rarity } from "../lib/types";

import { useToast } from "../hooks/use-toast";
import { useState } from 'react';
import { useAuth } from "./auth-provider";

type ShopItemCardProps = {
  item: ShopItem;
};

export function ShopItemCard({ item }: ShopItemCardProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Normalize rarity to match the expected format (capitalize first letter)
    const normalizedRarity = item.rarity 
      ? (item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1).toLowerCase()) as Rarity
      : 'Common' as Rarity;
    
    // Debug log
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎨 CARD: ${item.name} | RAW: "${item.rarity}" → "${normalizedRarity}" | BORDER: ${rarityBorders[normalizedRarity]}`);
    }

    const handlePurchase = async () => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please log in to make purchases.",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);
        
        try {
            // First check user balance
            const balanceResponse = await fetch('/api/user/stats');
            
            if (!balanceResponse.ok) {
                if (balanceResponse.status === 401) {
                    throw new Error('Session expired. Please log in again.');
                }
                const balanceData = await balanceResponse.json();
                throw new Error(balanceData.error || 'Failed to fetch balance');
            }
            
            const balanceData = await balanceResponse.json();

            // API returns stats.coins not coins directly
            const currentCoins = balanceData.stats?.coins || balanceData.coins || 0;
            
            console.log('💰 PURCHASE CHECK:', {
                currentCoins,
                itemPrice: item.price,
                balanceData
            });

            if (currentCoins < item.price) {
                toast({
                    title: "Insufficient Coins",
                    description: `You need ${item.price.toLocaleString()} coins but only have ${currentCoins.toLocaleString()} coins.`,
                    variant: "destructive"
                });
                return;
            }

            // Proceed with purchase
            const purchaseResponse = await fetch('/api/shop/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    itemId: item.id,
                    itemName: item.name,
                    price: item.price
                })
            });

            const purchaseData = await purchaseResponse.json();

            if (!purchaseResponse.ok) {
                // Check if it's a verification error
                if (purchaseData.requiresVerification) {
                    toast({
                        title: "🔒 Account Verification Required",
                        description: purchaseData.error || "Please verify your email or Steam account to use coins and gems.",
                        variant: "destructive"
                    });
                    // Refresh notifications to show the new one
                    window.dispatchEvent(new Event('notificationsUpdated'));
                    return;
                }
                throw new Error(purchaseData.error || 'Purchase failed');
            }

            toast({
                title: "Item Purchased!",
                description: `You have successfully purchased ${item.name} for ${item.price.toLocaleString()} coins. New balance: ${purchaseData.newBalance.toLocaleString()} coins.`,
            });

            // Emit inventory update event for real-time updates
            const inventoryUpdateEvent = new CustomEvent('inventoryUpdate', {
                detail: {
                    type: 'purchase',
                    itemId: item.id,
                    itemName: item.name,
                    price: item.price
                }
            });
            window.dispatchEvent(inventoryUpdateEvent);
            
            // Dispatch balance update event to update mini profile
            const balanceUpdateEvent = new CustomEvent('balanceUpdated', {
                detail: {
                    type: 'purchase',
                    newBalance: purchaseData.newBalance,
                    itemName: item.name,
                    price: item.price
                }
            });
            window.dispatchEvent(balanceUpdateEvent);

        } catch (error) {
            console.error('Purchase error:', error);
            toast({
                title: "Purchase Failed",
                description: error instanceof Error ? error.message : 'An unexpected error occurred.',
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }
  
  return (
    <Card className={cn(
      "group overflow-hidden bg-gradient-to-br transition-all flex flex-col border-2 hover:scale-105 hover:shadow-xl",
      rarityBorders[normalizedRarity],
      rarityGradients[normalizedRarity],
      rarityGlow[normalizedRarity]
    )}>
      <CardContent className="p-4 flex-grow flex flex-col items-center text-center">
        <div className="relative w-32 h-32 mb-4 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 rounded">
          {item.image || item.name ? (
            <img 
              src={item.image || '/assets/placeholder.svg'}
              alt={item.name}
              className="w-full h-full object-contain p-2 transition-transform group-hover:scale-110"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src.indexOf('/assets/placeholder.svg') === -1) {
                  target.src = '/assets/placeholder.svg';
                }
              }}
            />
          ) : (
            <div className="w-16 h-16 text-primary transition-transform group-hover:scale-110 flex items-center justify-center">
              <ShoppingCart className="w-8 h-8" />
            </div>
          )}
        </div>
        <h3 className="font-semibold text-lg flex-grow">{item.name}</h3>
        <p className={cn("font-bold text-sm uppercase", rarityColors[normalizedRarity])}>{normalizedRarity}</p>
        <p className="text-xs text-muted-foreground mt-2">{item.description}</p>
      </CardContent>
      <CardFooter className="p-2 border-t mt-auto space-y-2 flex-col">
        <div className='flex items-center justify-center gap-2 text-lg font-bold text-green-400'>
            <Coins className='w-4 h-4' />
            <span>{item.price.toLocaleString()}</span>
        </div>
        <Button 
          className="w-full" 
          onClick={handlePurchase}
          disabled={isLoading || !user}
        >
          {isLoading ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <ShoppingCart className='mr-2' />
          )}
          {isLoading ? 'Purchasing...' : 'Purchase'}
        </Button>
      </CardFooter>
    </Card>
  );
}
