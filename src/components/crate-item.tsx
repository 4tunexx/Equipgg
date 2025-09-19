
'use client';

import Image from 'next/image';
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Key } from 'lucide-react';
import { DBCrate, DBItem } from "../lib/supabase/queries";
import { cn } from "../lib/utils";
import { fallbackImages } from "../lib/constants";

interface CrateWithItems extends DBCrate {
  items: Array<DBItem & { dropChance: number }>;
  dataAiHint?: string;
  rarityChances?: string;
}

interface CrateItemProps {
  crate: CrateWithItems;
  onOpen: (crateId: string) => void;
  disabled?: boolean;
};

export function CrateItem({ crate, onOpen, disabled = false }: CrateItemProps) {
  return (
    <Card className={cn("group overflow-hidden bg-card/50  transition-all flex flex-col", disabled ? 'opacity-50' : 'hover:border-primary/50')}>
      <CardContent className="p-4 flex-grow flex flex-col items-center text-center">
        <div className="relative w-32 h-32 mb-4">
          <Image
            src={crate.image || '/assets/placeholder.svg'}
            alt={crate.name}
            width={128}
            height={128}
            className={cn("object-contain transition-transform", !disabled && "group-hover:scale-110")}
            data-ai-hint={crate.dataAiHint}
          />
        </div>
        <h3 className="font-bold text-lg">{crate.name}</h3>
        <p className="text-xs text-muted-foreground mt-2 flex-grow">{crate.description}</p>
        <p className="text-xs font-mono text-primary/80 mt-4">{crate.rarityChances}</p>
      </CardContent>
      <div className="p-4 border-t mt-auto space-y-2">
                  <Button className="w-full" onClick={() => onOpen(crate.id)} disabled={disabled}>
            {disabled ? 'Opening...' : 'Open Crate'}
          </Button>
      </div>
    </Card>
  );
}
