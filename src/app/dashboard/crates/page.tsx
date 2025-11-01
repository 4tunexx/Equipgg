
'use client';

import { useState, useEffect } from 'react';
import { Button } from "../../../components/ui/button";
import { CrateItem } from "../../../components/crate-item";
import { CrateOpeningAnimation } from "../../../components/crate-opening-animation";
import { useAuth } from "../../../hooks/use-auth";
import { createSupabaseQueries } from "../../../lib/supabase/queries";
import { supabase } from "../../../lib/supabase/client";
import type { DBCrate, DBInventoryItem, DBItem, Rarity } from "../../../lib/supabase/queries";
import { ExtendedRarity } from "../../../types/crate";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Image from 'next/image';
import ItemImage from "../../../components/ItemImage";
import { cn } from "../../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { CheckCircle, Gift, Star, Trophy, Coins, X } from 'lucide-react';
import { useToast } from "../../../hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../components/ui/alert-dialog";

// Using ExtendedRarity imported from types/crate.ts

// Define utility constants
const rarityColors: Record<ExtendedRarity, string> = {
  'Common': 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
  'Uncommon': 'from-green-500/20 to-green-600/20 border-green-500/30',
  'Rare': 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  'Epic': 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
  'Exotic': 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
  'Legendary': 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30'
};

const rarityGlow: Record<ExtendedRarity, string> = {
  'Common': 'shadow-gray-500/50',
  'Uncommon': 'shadow-green-500/50',
  'Rare': 'shadow-blue-500/50',
  'Epic': 'shadow-purple-500/50',
  'Exotic': 'shadow-purple-500/50',
  'Legendary': 'shadow-yellow-500/50'
};

// Type aliases for easier use
type InventoryItem = DBInventoryItem & { item: DBItem };

// Define the flattened structure for won item that API now returns
interface CrateWonItem {
  id: number;
  name: string;
  type: string;
  rarity: ExtendedRarity;
  image?: string;
  image_url?: string;
}

interface CrateWithItems extends DBCrate {
  items: Array<{
    id: number;
    name: string;
    type: string;
    rarity: ExtendedRarity;
    image: string;
    dropChance: number;
  }>;
  xpReward?: number;
  coinReward?: number;
}

type CrateData = CrateWithItems;


const greatnessFeatures = [
    {
        icon: Trophy,
        title: "Exciting Rewards",
        description: "Every crate offers a chance at rare and legendary items to enhance your profile."
    },
    {
        icon: Star,
        title: "Variety of Odds",
        description: "From beginner-friendly Level Up Crates to elite Prestige Crates, there’s a drop rate for every player."
    },
    {
        icon: Gift,
        title: "Event Exclusives",
        description: "Limited-time crates like Summer 2025 bring unique items you won’t find anywhere else."
    },
    {
        icon: CheckCircle,
        title: "Thrilling Unboxing",
        description: "Experience the suspense and joy of opening crates with every spin!"
    }
];

// Calculate inventory slots based on user level: 10 slots at level 1, +5 every 5 levels
const getInventorySlots = (level: number): number => {
  if (level <= 1) return 10;
  if (level <= 5) return 15;
  if (level <= 10) return 20;
  if (level <= 15) return 25;
  if (level <= 20) return 30;
  if (level <= 25) return 35;
  if (level <= 30) return 40;
  if (level <= 35) return 45;
  if (level <= 40) return 50;
  if (level <= 45) return 55;
  if (level <= 50) return 60;
  // For levels above 50, add 5 slots every 5 levels
  return Math.min(60 + Math.floor((level - 50) / 5) * 5, 100); // Max 100 slots
};

export default function CratesPage() {
  const { user } = useAuth();
  const [isOpening, setIsOpening] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [wonItem, setWonItem] = useState<CrateWonItem | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [activeCrate, setActiveCrate] = useState<CrateData | null>(null);
  const [userKeys, setUserKeys] = useState<Record<number, number>>({});
  const [inventoryCount, setInventoryCount] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [showInventoryFullAlert, setShowInventoryFullAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allCrates, setAllCrates] = useState<CrateData[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const { toast } = useToast();

  // Fetch user data and crates from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const queries = createSupabaseQueries(supabase);
        
        // Fetch crates with items from Supabase
        const crates = await queries.getAllCrates();
        
        // Fetch items for each crate
        const cratesWithItems = await Promise.all(
          crates.map(async (crate) => {
            try {
              const crateItems = await queries.getCrateItems(crate.id);
              return {
                ...crate,
                items: crateItems.map(ci => ({
                  id: ci.item!.id,
                  name: ci.item!.name,
                  type: ci.item!.type,
                  rarity: ci.item!.rarity,
                  image: ci.item!.image_url || ci.item!.image || '',
                  dropChance: ci.drop_chance
                })),
                xpReward: crate.xp_reward || 50,
                coinReward: crate.coin_reward || 100
              };
            } catch (error) {
              console.warn(`No items for crate ${crate.id}:`, error);
              return {
                ...crate,
                items: [],
                xpReward: crate.xp_reward || 50,
                coinReward: crate.coin_reward || 100
              };
            }
          })
        );
        setAllCrates(cratesWithItems);
        
        // Fetch user inventory from Supabase with proper error handling
        try {
          const inventory = await queries.getUserInventory(user.id);
          setInventoryData(inventory as InventoryItem[]);
          setInventoryCount(inventory.length);
        } catch (invError) {
          // Silently handle inventory fetch error - user may not have any items yet
          setInventoryData([]);
          setInventoryCount(0);
        }
        
        // Fetch user crate keys from database
        try {
          const keysData = await queries.getUserCrateKeys(user.id);
          const keysMap: Record<number, number> = {};
          keysData?.forEach((key: any) => {
            keysMap[key.crate_id] = key.keys_count || 0;
          });
          setUserKeys(keysMap);
          console.log('🔑 Fetched crate keys from database:', keysMap);
        } catch (keysError) {
          console.warn('Error fetching crate keys:', keysError);
          setUserKeys({});
        }

        // Fetch user profile for level 
        const profileResponse = await fetch('/api/user/stats', { credentials: 'include' });
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUserLevel(profileData.stats?.level || 1);
        } else {
          console.error('Failed to fetch user profile:', profileResponse.status);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    // Listen for key updates
    const handleKeyUpdate = () => {
      console.log('🔄 Key update event received, refreshing keys...');
      fetchUserData();
    };

    window.addEventListener('keyUpdated', handleKeyUpdate);
    window.addEventListener('balanceUpdated', handleKeyUpdate);

    return () => {
      window.removeEventListener('keyUpdated', handleKeyUpdate);
      window.removeEventListener('balanceUpdated', handleKeyUpdate);
    };
  }, [user]);

  const handleOpenCrate = async (crate: CrateData) => {
    if (isAnimating) return;

    const maxSlots = getInventorySlots(userLevel);
    if (inventoryCount >= maxSlots) {
        setShowInventoryFullAlert(true);
        return;
    }

    if ((userKeys[crate.id] || 0) <= 0) {
        toast({
            variant: "destructive",
            title: "No Keys!",
            description: `You don't have any keys for the ${crate.name}.`
        });
        return;
    }
    
    console.log('🎁 Opening crate:', crate.name, 'with items:', crate.items?.length || 0);
    console.log('📦 Crate items:', crate.items);
    
    setActiveCrate(crate);
    setIsAnimating(true);

    try {
        // Call crate opening API
        const response = await fetch('/api/crates/open', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                crateId: crate.id  // numeric ID
            })
        });

        const data = await response.json();

        if (response.ok) {
            setWonItem(data.wonItem);
            setIsRevealed(false);
            setIsOpening(true);
            
            // Update keys count
            setUserKeys(prev => ({ ...prev, [crate.id]: Math.max(0, (prev[crate.id] || 0) - 1) }));

            console.log('🎁 CRATE OPENING - CRITICAL LOG - Item received:', data.wonItem);
            
            // Set the wonItem for display - this is the MOST IMPORTANT part for the animation
            // CRITICAL FIX: The API now returns a simplified structure with no nested 'item' property
            const wonItemData = {
                id: data.wonItem.id,
                name: data.wonItem.name,
                type: data.wonItem.type,
                rarity: data.wonItem.rarity,
                image: data.wonItem.image || ''
            };
            
            console.log('🔥 CRITICAL - Using the following item for animation:', wonItemData);
            
            // Emit inventory update event
            const inventoryUpdateEvent = new CustomEvent('inventoryUpdate', {
                detail: {
                    type: 'crate_opening',
                    itemId: wonItemData.id,
                    itemName: wonItemData.name,
                    crateId: crate.id,
                    crateName: crate.name
                }
            });
            window.dispatchEvent(inventoryUpdateEvent);

            // Dispatch balance update event to refresh user stats
            const balanceUpdateEvent = new CustomEvent('balanceUpdated', {
                detail: {
                    coins: data.coinReward,
                    xp: data.xpReward
                }
            });
            window.dispatchEvent(balanceUpdateEvent);

            setTimeout(() => {
                setIsAnimating(false);
                setInventoryCount(prev => prev + 1);
            }, 8000);
        } else {
            throw new Error(data.error || 'Failed to open crate');
        }
    } catch (error) {
        console.error('Crate opening error:', error);
        toast({
            variant: "destructive",
            title: "Crate Opening Failed",
            description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        });
        setIsAnimating(false);
    }
  };

  const handleAnimationEnd = () => {
    setIsRevealed(true);
  };
  
  const handleReset = () => {
    setIsOpening(false);
    setTimeout(() => {
        setWonItem(null);
        setActiveCrate(null);
        setIsRevealed(false);
    }, 300);
  }

  // Show loading state while checking authentication
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Please log in to view crates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">EquipGG Crates – Unlock Your CS2 Treasure!</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto mt-2">Get ready to unbox the excitement with EquipGG crates! Earned through leveling up, loyalty, prestige, or special events, these crates offer a thrilling chance to snag rare skins, knives, gloves, and more. Each crate comes with its own rarity odds, so open your crates and see what legendary loot awaits!</p>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading crates...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {allCrates.map((crate) => (
            <CrateItem 
              key={crate.id} 
              crate={crate} 
              onOpen={() => handleOpenCrate(crate)} 
              disabled={isAnimating}
              keyCount={userKeys[crate.id] || 0}
            />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
            <CardTitle className="text-center text-2xl font-bold font-headline">Why Crates Are Your Key to Greatness</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {greatnessFeatures.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                    <feature.icon className="w-8 h-8 text-primary mt-1 shrink-0" />
                    <div>
                        <h3 className="font-semibold">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                </div>
            ))}
        </CardContent>
      </Card>

      <AlertDialog open={showInventoryFullAlert} onOpenChange={setShowInventoryFullAlert}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Inventory Full</AlertDialogTitle>
                <AlertDialogDescription>
                    You cannot open a crate because your inventory is full ({inventoryCount}/{getInventorySlots(userLevel)} slots used). 
                    Please sell or delete items to make space, or level up to get more inventory slots!
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShowInventoryFullAlert(false)}>OK</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isOpening} onOpenChange={(open) => !open && handleReset()}>
        <DialogContent className="max-w-6xl p-0 max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-md border-primary/30" onInteractOutside={(e) => isRevealed ? undefined : e.preventDefault()} onEscapeKeyDown={(e) => isRevealed ? undefined : e.preventDefault()}>
            <VisuallyHidden>
                <DialogHeader>
                    <DialogTitle>Crate Opening</DialogTitle>
                    <DialogDescription>Opening your crate to reveal the item inside</DialogDescription>
                </DialogHeader>
            </VisuallyHidden>
            <div className="min-h-[500px] flex flex-col justify-center items-center relative py-8">
                {/* Skip Button */}
                {!isRevealed && (
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleAnimationEnd}
                        className="absolute top-4 right-4 z-50 bg-background/80 hover:bg-background"
                    >
                        Skip Animation
                    </Button>
                )}
                {wonItem && activeCrate && (() => {
                  // CRITICAL: Convert wonItem ID to number first
                  const wonItemId = typeof wonItem.id === 'string' ? parseInt(wonItem.id) : wonItem.id;
                  const wonItemImage = wonItem.image || wonItem.image_url || 
                    `https://www.csgodatabase.com/images/skins/webp/${wonItem.name.replace(/\s*\|\s*/g, '_').replace(/\s+/g, '_')}.webp`;
                  
                  console.log('\n\u274c\u274c\u274c CRITICAL ANIMATION DATA \u274c\u274c\u274c');
                  console.log('🎯 WON ITEM ID:', wonItemId, 'Type:', typeof wonItemId);
                  console.log('🎯 WON ITEM NAME:', wonItem.name);
                  console.log('🎯 WON ITEM IMAGE:', wonItemImage.substring(0, 60));
                  
                  // Map crate items with CONSISTENT ID types
                  const crateItems = activeCrate.items && activeCrate.items.length > 0 
                    ? activeCrate.items.map((item: any) => {
                        // CRITICAL: Convert ALL item IDs to numbers
                        const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
                        // PRIORITIZE database image_url - only use generated URL if database image is empty
                        const dbImage = item.image_url || item.image;
                        const imageUrl = dbImage && dbImage.trim() !== '' && !dbImage.includes('placeholder')
                          ? dbImage
                          : `https://www.csgodatabase.com/images/skins/webp/${item.name.replace(/\s*\|\s*/g, '_').replace(/\s+/g, '_')}.webp`;
                        
                        const mappedItem = {
                          id: itemId,
                          name: item.name,
                          type: item.type || item.category,
                          rarity: item.rarity,
                          image: imageUrl
                        };
                        
                        // Log if this is the won item
                        if (itemId === wonItemId) {
                          console.log('✅ FOUND WON ITEM IN CRATE ITEMS:', item.name, 'ID:', itemId);
                        }
                        
                        return mappedItem;
                      })
                    : [];
                  
                  console.log('🏦 Total crate items:', crateItems.length);
                  console.log('🔍 Crate items IDs:', crateItems.map(i => i.id));
                  console.log('🔍 Won item in crate items?', crateItems.some(i => i.id === wonItemId) ? '✅ YES' : '❌ NO');
                  console.log('\u274c\u274c\u274c END CRITICAL DATA \u274c\u274c\u274c\n');
                  
                  const finalWonItem = {
                    id: wonItemId,
                    name: wonItem.name,
                    type: wonItem.type || '',
                    rarity: wonItem.rarity,
                    image: wonItemImage
                  };
                  
                  return <CrateOpeningAnimation 
                    items={crateItems}
                    wonItem={finalWonItem}
                    crateImage={activeCrate.image_url || undefined}
                    crateName={activeCrate.name}
                    onAnimationEnd={handleAnimationEnd} 
                  />;
                })()}
            </div>
            {isRevealed && wonItem && activeCrate && (
                 <div className="absolute inset-0 bg-background/95 flex flex-col items-center justify-center animate-in fade-in-50 duration-500 z-[200] overflow-y-auto py-8">
                    <div className="absolute top-4 right-4 z-[210]">
                      <Button
                        onClick={handleReset}
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-destructive/10 h-8 w-8"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-center text-3xl font-bold">You Won!</DialogTitle>
                    </DialogHeader>
                    <div className="mt-10 mb-8 flex items-center justify-center">
                        <div className={cn("p-4 w-64 h-64 flex items-center justify-center rounded-md", 
                            wonItem.rarity === 'Legendary' ? 'bg-orange-500/20' : 
                            wonItem.rarity === 'Exotic' ? 'bg-purple-500/20' :
                            wonItem.rarity === 'Rare' ? 'bg-blue-500/20' :
                            wonItem.rarity === 'Uncommon' ? 'bg-green-500/20' :
                            'bg-gray-500/20'
                        )}>
                            <div className="relative w-full h-full">
                                <Image
                                    src={wonItem.image || 
                                        `https://www.csgodatabase.com/images/skins/webp/${wonItem.name.replace(/\s*\|\s*/g, '_').replace(/\s+/g, '_')}.webp`}
                                    alt={wonItem.name}
                                    width={200}
                                    height={200}
                                    className="object-contain w-full h-full"
                                    onError={(e) => {
                                        // Fallback to a default image if the main image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/images/placeholder-item.png';
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogDescription className="text-center text-xl mb-2">
                        {wonItem.name}
                    </DialogDescription>
                    <p className={cn("text-center font-semibold",
                        wonItem.rarity === 'Legendary' ? 'text-orange-500' : 
                        wonItem.rarity === 'Exotic' ? 'text-purple-500' :
                        wonItem.rarity === 'Rare' ? 'text-blue-500' :
                        wonItem.rarity === 'Uncommon' ? 'text-green-500' :
                        'text-gray-500'
                    )}>
                        {wonItem.rarity}
                    </p>
                    <div className='flex items-center gap-2 text-sky-400 font-semibold'>
                        <Star className="w-5 h-5"/> +{activeCrate.xpReward || 50} XP
                    </div>
                    <div className='flex items-center gap-2 text-yellow-400 font-semibold'>
                        <Coins className="w-5 h-5"/> +{activeCrate.coinReward || 100} Coins
                    </div>
                    <div className="mt-8 flex gap-4 relative z-[210]">
                      <Button 
                        onClick={handleReset}
                        variant="outline"
                        className="relative z-[110]"
                      >
                        Close
                      </Button>
                      <Button 
                        onClick={() => handleOpenCrate(activeCrate)} 
                        disabled={isAnimating || (userKeys[activeCrate.id] || 0) <= 0} 
                        className="relative z-[110]"
                      >
                        Open Another {activeCrate.name}
                      </Button>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
