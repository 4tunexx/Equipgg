
'use client';

import { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ArrowRight, Bot, Loader2, Sparkles, XCircle } from 'lucide-react';
import { InventoryItem, Rarity, rarityColors, rarityGlow } from "../lib/types";
import { cn } from "../lib/utils";
import { useToast } from "../hooks/use-toast";
import ItemImage from "./ItemImage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

const TRADEUP_SLOTS = 5;

interface TradeUpResult {
    newItem: InventoryItem;
    success: boolean;
    reason: string;
}

interface TradeUpProps {
    inventory: InventoryItem[];
    onTradeUpComplete: (usedItemIds: string[], newItem: InventoryItem) => void;
}

const allRarities: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

const renderInventoryGrid = (items: InventoryItem[], onSelect: (item: InventoryItem) => void, selectedIds: Set<string>) => (
    <ScrollArea className="flex-grow bg-card/50 rounded-lg p-4 border border-white/10 h-[600px]">
        <TooltipProvider delayDuration={200}>
           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {items.map((item) => {
              const isSelected = selectedIds?.has(item.id);

              const getRarityBorderColor = (rarity: string) => {
                const r = rarity?.toLowerCase();
                if (r === 'common') return '#b0c3d9';
                if (r === 'uncommon') return '#5e98d9';
                if (r === 'rare') return '#4b69ff';
                if (r === 'epic') return '#8847ff';
                if (r === 'legendary') return '#d32ce6';
                if (r === 'mythic') return '#ffd700';
                return '#b0c3d9';
              };

              return (
                <Card
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className={cn(
                    'overflow-hidden group bg-secondary/50 border-2 transition-all aspect-square flex items-center justify-center relative rounded-lg cursor-pointer',
                    isSelected ? 'border-primary' : 'hover:border-primary/50',
                    rarityGlow[item.rarity]
                  )}
                  style={{
                    borderColor: isSelected ? 'var(--primary)' : getRarityBorderColor(item.rarity),
                    borderWidth: '2px'
                  }}
                >
                  <ItemImage
                    itemName={item.name}
                    itemType={(item as any).image?.includes('/knives/') ? 'knives' :
                              (item as any).image?.includes('/gloves/') ? 'gloves' :
                              (item as any).image?.includes('/agents/') ? 'agents' :
                              'skins'}
                    imageUrl={(item as any).image}
                    width={128}
                    height={96}
                    className="p-2 object-contain transition-transform group-hover:scale-110"
                  />
                  {(item as any).quantity > 1 && (
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs font-bold px-1.5 py-0.5 rounded-md border border-primary/50">
                      x{(item as any).quantity}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </TooltipProvider>
      </ScrollArea>
);

export function TradeUp({ inventory, onTradeUpComplete }: TradeUpProps) {
    const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
    const [selectedRarity, setSelectedRarity] = useState<Rarity | 'all'>('all');
    const [result, setResult] = useState<TradeUpResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleItemSelect = (item: InventoryItem) => {
        // Prevent selection if already processing
        if (isLoading) return;

        // Reset result when selection changes
        if (result) setResult(null);

        const isSelected = selectedItems.find(i => i.id === item.id);
        const quantity = (item as any).quantity || 1;

        if (isSelected) {
            // Remove all instances of this item
            setSelectedItems(selectedItems.filter(i => i.id !== item.id));
        } else {
            // First item sets the rarity for the contract
            if (selectedItems.length > 0 && item.rarity !== selectedItems[0].rarity) {
                toast({
                    variant: 'destructive',
                    title: "Rarity Mismatch",
                    description: "All items in a trade-up must be of the same rarity.",
                });
                return;
            }
            if (item.rarity === 'Legendary') {
                 toast({
                    variant: 'destructive',
                    title: "Max Rarity",
                    description: "Legendary items cannot be traded up.",
                });
                return;
            }

            // For stacked items, add up to quantity but respect the 5 slot limit
            const itemsToAdd: any[] = [];
            for (let i = 0; i < quantity && selectedItems.length + itemsToAdd.length < TRADEUP_SLOTS; i++) {
                itemsToAdd.push({ ...item, id: `${item.id}_${i}` }); // Create unique IDs for stacked items
            }
            
            if (itemsToAdd.length > 0) {
                setSelectedItems([...selectedItems, ...itemsToAdd]);
            } else {
                 toast({
                    variant: 'destructive',
                    title: "Slots Full",
                    description: `You can only select ${TRADEUP_SLOTS} items.`,
                });
            }
        }
    };

    const handleTradeUp = async () => {
        if (selectedItems.length !== TRADEUP_SLOTS) return;
        
        setIsLoading(true);
        setResult(null);

        // Extract base IDs (remove suffixes added for stacked items)
        const itemIds = selectedItems.map(item => item.id.split('_')[0]);
        
        console.log('🔍 Trade-up - Selected items:', selectedItems);
        console.log('🔍 Trade-up - Sending item IDs:', itemIds);

        try {
            const response = await fetch('/api/inventory/trade-up', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    itemIds
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Notify parent component to update the main inventory
                onTradeUpComplete(selectedItems.map(i => i.id), data.outputItem);
                
                toast({
                    title: "🔄 Trade-Up Complete!",
                    description: data.message,
                });
                
                setResult({
                    newItem: data.outputItem,
                    success: true,
                    reason: data.message
                });
            } else {
                throw new Error(data.error || 'Trade-up failed');
            }
        } catch (error) {
            console.error("Trade-up failed:", error);
            toast({
                variant: 'destructive',
                title: "Trade-Up Failed",
                description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again later.",
            });
        } finally {
            setIsLoading(false);
            setSelectedItems([]);
        }
    };
    
    const handleReset = () => {
        setSelectedItems([]);
        setResult(null);
        setIsLoading(false);
    }
    
    const eligibleItems = inventory.filter(item => {
        // Filter out equipped items
        if ((item as any).equipped) return false;
        
        // Filter out items in trade offers (in_escrow)
        if ((item as any).in_escrow) return false;
        
        if (selectedItems.length > 0) {
            return item.rarity === selectedItems[0].rarity;
        }
        if (selectedRarity === 'all') {
            return item.rarity !== 'Legendary';
        };
        return item.rarity === selectedRarity;
    });

    const selectedIds = new Set(selectedItems.map(i => i.id));
    
    const availableRarities = allRarities.filter(rarity => rarity !== 'Legendary' && inventory.some(item => item.rarity === rarity));


    return (
        <Card>
            <CardHeader>
                <CardTitle>Trade-Up Contract</CardTitle>
                <CardDescription>Select 5 items of the same rarity for a chance at a higher-tier item. Legendary items cannot be traded up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="flex items-center justify-center gap-4">
                    {/* Input Items */}
                    <div className="grid grid-cols-5 gap-4 flex-1">
                       {Array.from({ length: TRADEUP_SLOTS }).map((_, index) => {
                           const item = selectedItems[index];
                           return (
                               <Card 
                                    key={index}
                                    className={cn("aspect-square rounded-lg border-2 flex items-center justify-center relative group/slot",
                                        item ? `border-primary/50 ${rarityGlow[item.rarity]}` : 'border-dashed border-white/10 bg-secondary/50'
                                    )}
                                >
                                {item ? (
                                    <>
                                        <ItemImage
                                          itemName={item.name}
                                          itemType={(item as any).image?.includes('/knives/') ? 'knives' :
                                                    (item as any).image?.includes('/gloves/') ? 'gloves' :
                                                    (item as any).image?.includes('/agents/') ? 'agents' :
                                                    'skins'}
                                          imageUrl={(item as any).image}
                                          width={96}
                                          height={96}
                                          className='p-2'
                                        />
                                        <button onClick={() => handleItemSelect(item)} className='absolute -top-2 -right-2 bg-background rounded-full opacity-0 group-hover/slot:opacity-100 transition-opacity z-10'>
                                            <XCircle className='w-5 h-5 text-red-500' />
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-muted-foreground text-sm">Slot {index + 1}</span>
                                )}
                           </Card>
                       )})}
                    </div>
                    
                    <div className='flex flex-col items-center gap-2'>
                        <ArrowRight className="w-8 h-8 text-primary"/>
                    </div>
                    
                    {/* Result Item */}
                    <Card className={cn(
                        "w-40 h-40 rounded-lg border-2 flex items-center justify-center p-4 transition-all duration-500",
                        result ? `border-primary ${rarityGlow[result.newItem.rarity]}` : 'border-dashed border-primary/50 bg-secondary/50',
                        isLoading ? 'animate-pulse' : ''
                    )}>
                        {isLoading ? (
                             <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin"/>
                        ) : result ? (
                            <div className="text-center animate-in fade-in zoom-in-50">
                                <ItemImage
                                  itemName={result.newItem.name}
                                  itemType={(result.newItem as any).image?.includes('/knives/') ? 'knives' :
                                            (result.newItem as any).image?.includes('/gloves/') ? 'gloves' :
                                            (result.newItem as any).image?.includes('/agents/') ? 'agents' :
                                            'skins'}
                                  imageUrl={(result.newItem as any).image}
                                  width={96}
                                  height={96}
                                />
                                <p className={cn("font-bold text-xs truncate", rarityColors[result.newItem.rarity])}>{result.newItem.name}</p>
                            </div>
                        ) : (
                             <div className='text-center text-muted-foreground'>
                                <Sparkles className="w-10 h-10 mx-auto text-primary"/>
                                <p className='font-semibold text-sm mt-2'>Result</p>
                            </div>
                        )}
                    </Card>
                </div>

                {result && (
                    <Card className="text-center p-4 bg-secondary/50 animate-in fade-in">
                        <CardTitle className={cn("text-xl", result.success ? "text-green-400" : "text-amber-400")}>
                            {result.success ? "Trade-Up Success!" : "Standard Outcome"}
                        </CardTitle>
                        <CardDescription>{result.reason}</CardDescription>
                    </Card>
                )}

                <div className="flex justify-center gap-4">
                    <Button 
                        size="lg" 
                        onClick={handleTradeUp}
                        disabled={selectedItems.length !== TRADEUP_SLOTS || isLoading || !!result}
                    >
                        {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <Bot className="mr-2" />}
                        {isLoading ? 'Crafting...' : 'Initiate Trade-Up'}
                    </Button>
                    {result && (
                        <Button size="lg" variant="outline" onClick={handleReset}>
                            Start New Trade-Up
                        </Button>
                    )}
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="font-bold text-lg">Your Eligible Items</h3>
                            <p className="text-sm text-muted-foreground">Select 5 items of the same rarity to begin.</p>
                        </div>
                        <Select
                            value={selectedRarity}
                            onValueChange={(value) => setSelectedRarity(value as Rarity | 'all')}
                            disabled={selectedItems.length > 0}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Rarity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tradable</SelectItem>
                                {availableRarities.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {renderInventoryGrid(eligibleItems, handleItemSelect, selectedIds)}
                </div>
            </CardContent>
        </Card>
    );
}
