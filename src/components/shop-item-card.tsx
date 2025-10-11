
'use client';

import ItemImage from "./ItemImage";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Coins, ShoppingCart, Loader2 } from 'lucide-react';
import type { Rarity } from "../lib/supabase/queries";
import { ShopItem } from '../types/shop';
import { cn } from "../lib/utils";

// Define utility constants locally
const rarityColors: Record<Rarity, string> = {
  'Common': 'text-gray-400',
  'Uncommon': 'text-indigo-400',
  'Rare': 'text-blue-400',
  'Epic': 'text-pink-400',
  'Legendary': 'text-purple-400'
};

const rarityBorders: Record<Rarity, string> = {
  'Common': 'border-gray-500/50',
  'Uncommon': 'border-indigo-500/50',
  'Rare': 'border-blue-500/50',
  'Epic': 'border-pink-500/50',
  'Legendary': 'border-purple-500/50'
};

const rarityGradients: Record<Rarity, string> = {
  'Common': 'from-gray-500/20 to-gray-600/20',
  'Uncommon': 'from-indigo-500/20 to-indigo-600/20',
  'Rare': 'from-blue-500/20 to-blue-600/20',
  'Epic': 'from-pink-500/20 to-pink-600/20',
  'Legendary': 'from-purple-500/20 to-purple-600/20'
};

const rarityGlow: Record<Rarity, string> = {
  'Common': 'shadow-gray-500/50',
  'Uncommon': 'shadow-indigo-500/50',
  'Rare': 'shadow-blue-500/50',
  'Epic': 'shadow-pink-500/50',
  'Legendary': 'shadow-purple-500/50'
};

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

            const currentCoins = balanceData.coins || 0;

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
      item.rarity ? rarityBorders[item.rarity] : 'border-gray-500/50',
      item.rarity ? rarityGradients[item.rarity] : 'from-gray-500/20 to-gray-600/20',
      item.rarity ? rarityGlow[item.rarity] : ''
    )}>
      <CardContent className="p-4 flex-grow flex flex-col items-center text-center">
        <div className="relative w-32 h-32 mb-4 flex items-center justify-center">
          {item.image || item.name ? (
            <ItemImage
              itemName={item.name}
              itemType={item.type as 'skins' | 'knives' | 'gloves' | 'agents'}
              imageUrl={item.image}
              width={128}
              height={128}
              className="object-contain transition-transform group-hover:scale-110"
            />
          ) : (
            <div className="w-16 h-16 text-primary transition-transform group-hover:scale-110 flex items-center justify-center">
              <ShoppingCart className="w-8 h-8" />
            </div>
          )}
        </div>
        <h3 className="font-semibold text-lg flex-grow">{item.name}</h3>
        {item.rarity && <p className={cn("font-bold text-sm capitalize", rarityColors[item.rarity])}>{item.rarity}</p>}
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
