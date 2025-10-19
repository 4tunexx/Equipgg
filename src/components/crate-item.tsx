
'use client';

import Image from 'next/image';
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { DBCrate, DBItem } from "../lib/supabase/queries";
import { cn } from "../lib/utils";

interface CrateWithItems extends DBCrate {
  items: Array<{
    id: number;
    name: string;
    type: string;
    rarity: string;
    image: string;
    dropChance: number;
  }>;
  dataAiHint?: string;
  rarityChances?: string;
  xpReward?: number;
  coinReward?: number;
}

interface CrateItemProps {
  crate: CrateWithItems;
  onOpen: (crateId: number) => void;
  disabled?: boolean;
  keyCount?: number;
};

export function CrateItem({ crate, onOpen, disabled = false, keyCount = 0 }: CrateItemProps) {
  // Calculate rarity distribution from items
  const rarityDistribution = crate.items.reduce((acc, item) => {
    const rarity = item.rarity;
    acc[rarity] = (acc[rarity] || 0) + (item.dropChance || 0);
    return acc;
  }, {} as Record<string, number>);

  const rarityColors: Record<string, string> = {
    'Common': 'text-gray-400',
    'Uncommon': 'text-green-400',
    'Rare': 'text-blue-400',
    'Epic': 'text-purple-400',
    'Legendary': 'text-yellow-400'
  };

  return (
    <Card className={cn("group overflow-hidden bg-card/50 transition-all flex flex-col", disabled ? 'opacity-50' : 'hover:border-primary/50')}>
      <CardContent className="p-4 flex-grow flex flex-col items-center text-center">
        <div className="relative w-32 h-32 mb-4">
          <Image
            src={crate.image_url || '/assets/placeholder.svg'}
            alt={crate.name}
            width={128}
            height={128}
            style={{ width: 'auto', height: '100%', maxWidth: '100%' }}
            className={cn("object-contain transition-transform", !disabled && "group-hover:scale-110")}
            data-ai-hint={crate.dataAiHint}
            unoptimized
            priority
          />
        </div>
        <h3 className="font-bold text-lg">{crate.name}</h3>
        <p className="text-xs text-muted-foreground mt-2 flex-grow">{crate.description}</p>
        
        {/* Odds Display */}
        {crate.items.length > 0 && (
          <div className="mt-3 text-[10px] font-mono space-y-0.5">
            <p className="text-muted-foreground font-semibold mb-1">Drop Rates:</p>
            {Object.entries(rarityDistribution).map(([rarity, chance]) => (
              <p key={rarity} className={cn("text-xs", rarityColors[rarity])}>
                {rarity}: {(chance * 100).toFixed(2)}%
              </p>
            ))}
          </div>
        )}
      </CardContent>
      <div className="p-4 border-t mt-auto space-y-2">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Keys:</span>
          <span className={cn("font-bold", keyCount > 0 ? "text-primary" : "text-destructive")}>
            {keyCount}
          </span>
        </div>
        <Button className="w-full" onClick={() => onOpen(crate.id)} disabled={disabled || keyCount <= 0}>
          {disabled ? 'Opening...' : keyCount <= 0 ? 'No Keys' : 'Open Crate'}
        </Button>
      </div>
    </Card>
  );
}
