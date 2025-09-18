
'use client';

import Image from 'next/image';
import ItemImage from '@/components/ItemImage';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, ShoppingCart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';

type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

type ShopItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  image: string;
  rarity: Rarity;
  type: string;
  stock: number;
};

const rarityColors = {
  Common: 'text-gray-400',
  Uncommon: 'text-green-400', 
  Rare: 'text-blue-400',
  Epic: 'text-purple-400',
  Legendary: 'text-orange-400'
};

const rarityGlow = {
  Common: 'shadow-gray-500/20',
  Uncommon: 'shadow-green-500/20',
  Rare: 'shadow-blue-500/20', 
  Epic: 'shadow-purple-500/20',
  Legendary: 'shadow-orange-500/20'
};

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
    <Card className={cn("group overflow-hidden bg-card/50  transition-all flex flex-col hover:border-primary/50", item.rarity ? rarityGlow[item.rarity] : '')}>
      <CardContent className="p-4 flex-grow flex flex-col items-center text-center">
        <div className="relative w-32 h-32 mb-4 flex items-center justify-center">
          {item.image ? (
            <ItemImage
              itemName={item.name}
              itemType={item.type as 'skins' | 'knives' | 'gloves' | 'agents'}
              width={128}
              height={128}
              className="object-contain transition-transform group-hover:scale-110"
            />
          ) : (
            item.icon && <item.icon className="w-16 h-16 text-primary transition-transform group-hover:scale-110" />
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
