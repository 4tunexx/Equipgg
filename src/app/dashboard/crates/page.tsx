
'use client';

import { useState, useEffect } from 'react';
import { Button } from "../../../components/ui/button";
import { CrateItem } from "../../../components/crate-item";
import { CrateOpeningAnimation } from "../../../components/crate-opening-animation";
import { useAuth } from "../../../hooks/use-auth";
import { createSupabaseQueries } from "../../../lib/supabase/queries";
import { supabase } from "../../../lib/supabase/client";
import type { DBCrate, DBInventoryItem, DBItem, Rarity } from "../../../lib/supabase/queries";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Image from 'next/image';
import ItemImage from "../../../components/ItemImage";
import { cn } from "../../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { CheckCircle, Gift, Star, Trophy, Coins } from 'lucide-react';
import { useToast } from "../../../hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../components/ui/alert-dialog";

// Define utility constants
const rarityColors: Record<Rarity, string> = {
  'Common': 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
  'Uncommon': 'from-green-500/20 to-green-600/20 border-green-500/30',
  'Rare': 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  'Epic': 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
  'Legendary': 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30'
};

const rarityGlow: Record<Rarity, string> = {
  'Common': 'shadow-gray-500/50',
  'Uncommon': 'shadow-green-500/50',
  'Rare': 'shadow-blue-500/50',
  'Epic': 'shadow-purple-500/50',
  'Legendary': 'shadow-yellow-500/50'
};

// Type aliases for easier use
type InventoryItem = DBInventoryItem & { item: DBItem };
interface CrateWithItems extends DBCrate {
  items: Array<DBItem & { dropChance: number }>;
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
  const [wonItem, setWonItem] = useState<InventoryItem | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [activeCrate, setActiveCrate] = useState<CrateData | null>(null);
  const [userKeys, setUserKeys] = useState<Record<string, number>>({});
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
        
        // Fetch crates from Supabase
        const crates = await queries.getAllCrates();
        // Transform DBCrate to CrateWithItems with mock data
        const cratesWithItems = crates.map(crate => ({
          ...crate,
          items: [], // Add empty items array for now
          xpReward: 50,
          coinReward: 100
        }));
        setAllCrates(cratesWithItems);
        
        // Fetch user inventory from Supabase
        const inventory = await queries.getUserInventory(user.id);
        setInventoryData(inventory as InventoryItem[]);
        setInventoryCount(inventory.length);
        
        // Fetch user keys with correct endpoint
        const keysResponse = await fetch(`/api/user/crate-keys?t=${Date.now()}`);
        if (keysResponse.ok) {
          const keysData = await keysResponse.json();
          setUserKeys(keysData.keys || {});
          console.log('🔑 Fetched crate keys:', keysData.keys);
        }

        // Fetch user profile for level 
        const profileResponse = await fetch('/api/user/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUserLevel(profileData.level || 1);
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
                crateId: crate.id,
                crateName: crate.name
            })
        });

        const data = await response.json();

        if (response.ok) {
            setWonItem(data.wonItem);
            setIsRevealed(false);
            setIsOpening(true);
            
            // Update keys count
            setUserKeys(prev => ({ ...prev, [crate.id]: Math.max(0, (prev[crate.id] || 0) - 1) }));

            // Emit inventory update event
            const inventoryUpdateEvent = new CustomEvent('inventoryUpdate', {
                detail: {
                    type: 'crate_opening',
                    itemId: data.wonItem.id,
                    itemName: data.wonItem.name,
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
        <h1 className="text-3xl font-bold font-headline">EquipGG.net Crates – Unlock Your CS2 Treasure Chest!</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto mt-2">Get ready to unbox the excitement with equipgg.net crates! Earned through leveling up, loyalty, prestige, trading, or special events, these crates offer a thrilling chance to snag rare skins, knives, gloves, and more. Each crate comes with its own rarity odds, so spin the wheel and see what legendary loot awaits! Dive into the collection below and start your unboxing adventure today!</p>
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
            <CrateItem key={crate.id} crate={crate} onOpen={() => handleOpenCrate(crate)} disabled={isAnimating || (userKeys[crate.id] || 0) <= 0} />
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
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card/90 backdrop-blur-sm border-primary/20">
            <VisuallyHidden>
                <DialogHeader>
                    <DialogTitle>Crate Opening</DialogTitle>
                    <DialogDescription>Opening your crate to reveal the item inside</DialogDescription>
                </DialogHeader>
            </VisuallyHidden>
            <div className="h-[450px] flex flex-col justify-center items-center relative">
                {wonItem && <CrateOpeningAnimation items={inventoryData.map(inv => ({
                  id: inv.item.id,
                  name: inv.item.name,
                  type: inv.item.type,
                  rarity: inv.item.rarity,
                  image: inv.item.image || '/placeholder.png'
                }))} wonItem={{
                  id: wonItem.item.id,
                  name: wonItem.item.name,
                  type: wonItem.item.type,
                  rarity: wonItem.item.rarity,
                  image: wonItem.item.image || '/placeholder.png'
                }} onAnimationEnd={handleAnimationEnd} />}
            </div>
            {isRevealed && wonItem && activeCrate && (
                 <div className="absolute inset-0 bg-background/95 flex flex-col items-center justify-center animate-in fade-in-50 duration-500">
                    <DialogHeader>
                        <DialogTitle className="text-center text-3xl font-bold">You Won!</DialogTitle>
                    </DialogHeader>
                    <div className={cn("relative my-4 w-48 h-48 animate-in zoom-in-50 duration-500", rarityGlow[wonItem.item.rarity as Rarity])}>
                        <ItemImage
                          itemName={wonItem.item.name}
                          itemType={wonItem.item.type as 'skins' | 'knives' | 'gloves' | 'agents'}
                          width={192}
                          height={192}
                          className="object-contain"
                        />
                    </div>
                    <h3 className={cn("text-2xl font-semibold", rarityColors[wonItem.item.rarity as Rarity])}>{wonItem.item.name}</h3>
                    <p className="text-muted-foreground">{wonItem.item.rarity} {wonItem.item.type}</p>

                    <div className="mt-4 flex items-center gap-6">
                        <div className='flex items-center gap-2 text-sky-400 font-semibold'>
                            <Star className="w-5 h-5"/> +{activeCrate.xpReward || 50} XP
                        </div>
                         <div className='flex items-center gap-2 text-yellow-400 font-semibold'>
                            <Coins className="w-5 h-5"/> +{activeCrate.coinReward || 100} Coins
                        </div>
                    </div>

                    <Button onClick={() => handleOpenCrate(activeCrate)} disabled={isAnimating || (userKeys[activeCrate.id] || 0) <= 0} className="mt-8">
                        Open Another {activeCrate.name}
                    </Button>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
