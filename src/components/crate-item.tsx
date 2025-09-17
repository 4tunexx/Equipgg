
'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key } from 'lucide-react';
import { CrateData } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

type CrateItemProps = {
  crate: CrateData;
  onOpen: (crateId: string) => void;
  disabled?: boolean;
  keysOwned: number;
};

export function CrateItem({ crate, onOpen, disabled = false, keysOwned }: CrateItemProps) {
  return (
    <Card className={cn("group overflow-hidden bg-card/50  transition-all flex flex-col", disabled ? 'opacity-50' : 'hover:border-primary/50')}>
      <CardContent className="p-4 flex-grow flex flex-col items-center text-center">
        <div className="relative w-32 h-32 mb-4">
          <Image
            src={crate.image}
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
        <div className='flex items-center justify-center gap-2 text-sm'>
            <Key className='w-4 h-4 text-primary' />
            <span className='font-semibold'>{keysOwned}</span>
            <span className='text-muted-foreground'>Keys Owned</span>
        </div>
        <Button className="w-full" onClick={() => onOpen(crate)} disabled={disabled}>
          {disabled && keysOwned > 0 ? 'Opening...' : 'Open Crate'}
          {keysOwned <= 0 && !disabled && '(No Keys)'}
        </Button>
      </div>
    </Card>
  );
}
