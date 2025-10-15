
'use client';

import Image from 'next/image';
import {
  Card,
  CardContent,
} from "../../../components/ui/card";
import { rarityGlow, rarityColors, rarityBorders, equippedSlotsConfig, InventoryItem, Rarity } from "../../../lib/types";
import { cn } from "../../../lib/utils";
import { ScrollArea } from "../../../components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../components/ui/tooltip";

import { Separator } from "../../../components/ui/separator";

import { Trash2, DollarSign, Replace, Loader2, Target, Shield, Sword, Hand, User } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { useToast } from "../../../hooks/use-toast";


import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { TradeUp } from "../../../components/trade-up";
import { InventoryLevelProgression } from "../../../components/inventory-level-progression";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from "../../../hooks/use-auth";
import { useBalance } from "../../../contexts/balance-context";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";

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

// EXACT SAME image URL function as admin/shop/landing pages
const getItemImageUrl = (itemName: string, category: string, existingImage?: string) => {
  // If item already has an image URL, use it
  if (existingImage) return existingImage;
  
  const baseUrl = 'https://www.csgodatabase.com/images';
  const categoryLower = category?.toLowerCase() || '';
  const nameLower = itemName?.toLowerCase() || '';
  
  // List of knife names that should use knives folder
  const knifeNames = ['karambit', 'bayonet', 'butterfly', 'falchion', 'flip', 'gut', 'huntsman', 
                      'bowie', 'shadow daggers', 'navaja', 'stiletto', 'ursus', 'talon', 
                      'classic knife', 'paracord', 'survival', 'nomad', 'skeleton', 'daggers'];
  
  // List of glove names that should use gloves folder
  const gloveNames = ['hand wraps', 'driver gloves', 'sport gloves', 'specialist gloves', 
                      'moto gloves', 'bloodhound gloves', 'hydra gloves', 'broken fang gloves'];
  
  // Agent names typically start with specific prefixes
  const agentPrefixes = ['agent', 'cmdr', 'lt.', 'sir', 'enforcer', 'operator', 
                         'ground rebel', 'osiris', 'ava', 'buckshot', 'two times', 
                         'sergeant bombson', 'chef d', "'medium rare' crasswater"];
  
  let path = 'skins';
  
  // Check if it's a knife by name or category
  if (categoryLower.includes('knife') || categoryLower === 'knives' || 
      knifeNames.some(knife => nameLower.includes(knife))) {
    path = 'knives';
  } 
  // Check if it's gloves by name or category
  else if (categoryLower.includes('glove') || categoryLower === 'gloves' || 
           gloveNames.some(glove => nameLower.includes(glove))) {
    path = 'gloves';
  }
  // Check if it's an agent by name or category
  else if (categoryLower.includes('agent') || categoryLower === 'agents' || 
           agentPrefixes.some(prefix => nameLower.startsWith(prefix) || nameLower.includes(prefix))) {
    path = 'agents';
  }
  
  const formattedName = itemName
    .replace(/\s*\|\s*/g, '_')
    .replace(/\s+/g, '_');
  return `${baseUrl}/${path}/webp/${formattedName}.webp`;
};

// Calculate slots per page (20 slots per page for better UX)
const SLOTS_PER_PAGE = 20;

export default function InventoryPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const { balance } = useBalance();
    const [localInventory, setLocalInventory] = useState<InventoryItem[]>([]);
    const [equippedItems, setEquippedItems] = useState<Record<string, InventoryItem>>({});
    const [inventoryStats, setInventoryStats] = useState<{totalValue: number; itemCount: number; rarityBreakdown: Record<string, number>} | null>(null);
    const [userLevel, setUserLevel] = useState<number>(1);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [draggedItem, setDraggedItem] = useState<InventoryItem | null>(null);
    const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
    const [isEquipping, setIsEquipping] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [showItemDialog, setShowItemDialog] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const dragPreviewRef = useRef<HTMLDivElement>(null);

    // Refresh inventory function
    const refreshInventory = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            // Fetch inventory and user level (balance is handled by context)
            const [inventoryResponse, userResponse] = await Promise.all([
                fetch('/api/inventory', { credentials: 'include' }),
                fetch('/api/me', { credentials: 'include' })
            ]);
            
            const inventoryData = await inventoryResponse.json();
            const userData = await userResponse.json();

            if (inventoryResponse.ok) {
                setLocalInventory(inventoryData.inventory || []);
                setEquippedItems(inventoryData.equipped || {});
                setInventoryStats(inventoryData.stats || null);
                setLastUpdateTime(Date.now());
            } else {
                toast({
                    title: "Error",
                    description: inventoryData.error || "Failed to load inventory",
                    variant: "destructive"
                });
            }

            if (userResponse.ok && userData.user) {
                setUserLevel(userData.user.level || 1);
            }
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            toast({
                title: "Error",
                description: "Failed to load inventory",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    // Fetch inventory data on component mount
    useEffect(() => {
        if (user) {
            refreshInventory();
        }
    }, [user, refreshInventory]);

    // Real-time updates for shop purchases and crate openings
    useEffect(() => {
        const handleInventoryUpdate = (event: CustomEvent) => {
            console.log('Inventory update event received:', event.detail);
            refreshInventory();
            
            if (event.detail.type === 'purchase') {
                toast({
                    title: "Item Added!",
                    description: `${event.detail.itemName} has been added to your inventory.`,
                });
            } else if (event.detail.type === 'crate_opening') {
                toast({
                    title: "Crate Opened!",
                    description: `You received ${event.detail.itemName} from the crate!`,
                });
            }
        };

        // Listen for inventory updates
        window.addEventListener('inventoryUpdate', handleInventoryUpdate as EventListener);
        
        // Listen for balance updates
        const handleBalanceUpdate = () => {
            refreshInventory();
        };
        window.addEventListener('balanceUpdated', handleBalanceUpdate);
        
        // Auto-refresh every 30 seconds to catch any missed updates
        const intervalId = setInterval(() => {
            refreshInventory();
        }, 30000);

        return () => {
            window.removeEventListener('inventoryUpdate', handleInventoryUpdate as EventListener);
            window.removeEventListener('balanceUpdated', handleBalanceUpdate);
            clearInterval(intervalId);
        };
    }, [refreshInventory, toast]);

    // Reset to page 1 when user level changes
    useEffect(() => {
        setCurrentPage(1);
    }, [userLevel]);

    const handleEquip = async (item: InventoryItem) => {
        if (!user || isEquipping) return;

        // Determine slot based on item type
        const slotMapping = {
            'Rifle': 'primary',
            'SMG': 'primary',
            'Heavy': 'primary',
            'Pistol': 'secondary',
            'Knife': 'knife',
            'Gloves': 'gloves',
            'Operator': 'agent'
        };

        const slot = slotMapping[item.type as keyof typeof slotMapping];
        if (!slot) {
            toast({
                title: "Cannot Equip",
                description: `${item.type} items cannot be equipped`,
                variant: "destructive"
            });
            return;
        }

        setIsEquipping(true);
        try {
            const response = await fetch('/api/inventory/equip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    itemId: item.id,
                    slot
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "Item Equipped!",
                    description: data.message,
                });
                // Update equipped items
                setEquippedItems(prev => ({
                    ...prev,
                    [slot]: item
                }));
            } else {
                toast({
                    title: "Equip Failed",
                    description: data.error || "Failed to equip item",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Failed to equip item:', error);
            toast({
                title: "Equip Failed",
                description: "Failed to equip item",
                variant: "destructive"
            });
        } finally {
            setIsEquipping(false);
        }
    };

    const handleSell = async (item: InventoryItem) => {
        if (!user) return;

        try {
            const response = await fetch('/api/inventory/sell', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    itemId: item.id
                })
            });

            const data = await response.json() as { price: number; error?: string };

            if (response.ok) {
                toast({
                    title: "Item Sold!",
                    description: `Sold ${item.name} for ${data.price} coins`,
                });
                // Remove item from local inventory
                setLocalInventory(prev => prev.filter(i => i.id !== item.id));
                // Dispatch balance update event
                window.dispatchEvent(new CustomEvent('balanceUpdated'));
                // Refresh inventory to get updated data
                refreshInventory();
            } else {
                toast({
                    title: "Sell Failed",
                    description: data.error || "Failed to sell item",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Failed to sell item:', error);
            toast({
                title: "Sell Failed",
                description: "Failed to sell item",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (item: InventoryItem) => {
        if (!user) return;

        try {
            const response = await fetch('/api/inventory/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    itemId: item.id
                })
            });

            const data = await response.json() as { error?: string };

            if (response.ok) {
                toast({
                    title: "Item Deleted!",
                    description: `Deleted ${item.name}`,
                });
                // Remove item from local inventory
                setLocalInventory(prev => prev.filter(i => i.id !== item.id));
                // Refresh inventory to get updated data
                refreshInventory();
            } else {
                toast({
                    title: "Delete Failed",
                    description: data.error || "Failed to delete item",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Failed to delete item:', error);
            toast({
                title: "Delete Failed",
                description: "Failed to delete item",
                variant: "destructive"
            });
        }
    };

    const handleTradeUpComplete = (usedItemIds: string[], newItem: InventoryItem) => {
        setLocalInventory(prev => {
            const newInventory = prev.filter(item => !usedItemIds.includes(item.id));
            const maxSlots = getInventorySlots(userLevel);
            if (newInventory.length < maxSlots) {
                newInventory.push(newItem);
            }
            return newInventory;
        });
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: InventoryItem) => {
      setDraggedItem(item);
      setIsDragging(true);
      // For better visual feedback
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
        
        // Create custom drag image
        const dragImage = document.createElement('div');
        dragImage.className = 'bg-card border-2 border-primary rounded-lg p-2 shadow-lg';
        dragImage.innerHTML = `
          <img src="${item.image}" alt="${item.name}" class="w-16 h-12 object-contain" />
          <p class="text-xs font-semibold text-center mt-1">${item.name}</p>
        `;
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 40, 30);
        
        setTimeout(() => document.body.removeChild(dragImage), 0);
      }
    };

    // Touch event handlers for mobile drag & drop
    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>, item: InventoryItem) => {
      const touch = e.touches[0];
      setTouchStartPos({ x: touch.clientX, y: touch.clientY });
      setDraggedItem(item);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
      if (!draggedItem || !touchStartPos) return;
      
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.y);
      
      // Start dragging if moved more than 10px
      if (deltaX > 10 || deltaY > 10) {
        setIsDragging(true);
        
        // Update drag preview position
        if (dragPreviewRef.current) {
          dragPreviewRef.current.style.left = `${touch.clientX - 40}px`;
          dragPreviewRef.current.style.top = `${touch.clientY - 30}px`;
          dragPreviewRef.current.style.display = 'block';
        }
        
        // Check what element is under the touch
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const equipSlot = elementBelow?.closest('[data-equip-slot]');
        const inventorySlot = elementBelow?.closest('[data-inventory-slot]');
        
        if (equipSlot) {
          const slot = equipSlot.getAttribute('data-equip-slot');
          setDragOverSlot(slot);
          setDragOverId(null);
        } else if (inventorySlot) {
          const itemId = inventorySlot.getAttribute('data-inventory-slot');
          setDragOverId(itemId);
          setDragOverSlot(null);
        } else {
          setDragOverSlot(null);
          setDragOverId(null);
        }
      }
    }, [draggedItem, touchStartPos]);

    const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
      if (!draggedItem || !isDragging) {
        setDraggedItem(null);
        setTouchStartPos(null);
        setIsDragging(false);
        return;
      }
      
      const touch = e.changedTouches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // Handle drop logic
      const equipSlot = elementBelow?.closest('[data-equip-slot]');
      const inventorySlot = elementBelow?.closest('[data-inventory-slot]');
      
      if (equipSlot) {
        handleEquip(draggedItem);
      } else if (inventorySlot) {
        const targetItemId = inventorySlot.getAttribute('data-inventory-slot') as string;
        const targetItem = localInventory.find(item => item.id === targetItemId);
        if (targetItem && targetItem.id !== draggedItem.id) {
          // Swap items
          setLocalInventory(prev => {
            const newInventory = [...prev];
            const draggedIndex = newInventory.findIndex(i => i.id === draggedItem.id);
            const targetIndex = newInventory.findIndex(i => i.id === targetItem.id);
            
            if (draggedIndex !== -1 && targetIndex !== -1) {
              [newInventory[draggedIndex], newInventory[targetIndex]] = [newInventory[targetIndex], newInventory[draggedIndex]];
            }
            return newInventory;
          });
        }
      }
      
      // Reset states
      setDraggedItem(null);
      setTouchStartPos(null);
      setIsDragging(false);
      setDragOverSlot(null);
      setDragOverId(null);
      
      if (dragPreviewRef.current) {
        dragPreviewRef.current.style.display = 'none';
      }
    }, [draggedItem, isDragging, localInventory, handleSell, handleEquip]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetItem: InventoryItem) => {
        e.preventDefault();
        if (draggedItem && draggedItem.id !== targetItem.id) {
          setDragOverId(targetItem.id);
        }
    };
    
    const handleDragLeave = () => {
        setDragOverId(null);
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetItem: InventoryItem) => {
        e.preventDefault();
        setDragOverId(null);
        if (draggedItem && draggedItem.id !== targetItem.id) {
            setLocalInventory(prev => {
                const newInventory = [...prev];
                const draggedIndex = newInventory.findIndex(i => i.id === draggedItem.id);
                const targetIndex = newInventory.findIndex(i => i.id === targetItem.id);
                
                if (draggedIndex !== -1 && targetIndex !== -1) {
                    // Swap items
                    [newInventory[draggedIndex], newInventory[targetIndex]] = [newInventory[targetIndex], newInventory[draggedIndex]];
                }
                return newInventory;
            });
        }
        setDraggedItem(null);
    };

    const handleDragEnd = () => {
      setDraggedItem(null);
      setDragOverId(null);
      setDragOverSlot(null);
      setIsDragging(false);
      if (dragPreviewRef.current) {
        dragPreviewRef.current.style.display = 'none';
      }
    }

    // Handle drag over equipped slots
    const handleEquipSlotDragOver = (e: React.DragEvent<HTMLDivElement>, slotId: string) => {
      e.preventDefault();
      if (draggedItem) {
        // Check if item can be equipped to this slot
        const slotMapping = {
          'primary': ['Rifle', 'SMG', 'Heavy'],
          'secondary': ['Pistol'],
          'knife': ['Knife'],
          'gloves': ['Gloves'],
          'agent': ['Operator']
        };
        
        const allowedTypes = slotMapping[slotId as keyof typeof slotMapping];
        if (allowedTypes && allowedTypes.includes(draggedItem.type)) {
          setDragOverSlot(slotId);
        }
      }
    };

    const handleEquipSlotDrop = (e: React.DragEvent<HTMLDivElement>, slotId: string) => {
      e.preventDefault();
      setDragOverSlot(null);
      
      if (draggedItem) {
        // Check if item can be equipped to this slot
        const slotMapping = {
          'primary': ['Rifle', 'SMG', 'Heavy'],
          'secondary': ['Pistol'],
          'knife': ['Knife'],
          'gloves': ['Gloves'],
          'agent': ['Operator']
        };
        
        const allowedTypes = slotMapping[slotId as keyof typeof slotMapping];
        if (allowedTypes && allowedTypes.includes(draggedItem.type)) {
          handleEquip(draggedItem);
        } else {
          toast({
            title: "Cannot Equip",
            description: `${draggedItem.type} items cannot be equipped to ${slotId} slot`,
            variant: "destructive"
          });
        }
      }
      setDraggedItem(null);
    };

    const handleEquipSlotDragLeave = () => {
      setDragOverSlot(null);
    };
    


    const renderAdvancedTooltip = (item: InventoryItem) => {
        const marketValue = Math.floor((item.stat?.value || 0) * 0.8); // 80% of item value
        const condition = 'Factory New'; // Default condition
        const wear = 0; // Default wear
        
        return (
            <div className="p-3 space-y-3 min-w-[280px]">
                <div className="space-y-1">
                    <h4 className="font-semibold text-sm">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <p className="text-muted-foreground">Rarity</p>
                        <p className={cn("font-medium", rarityColors[item.rarity])}>{item.rarity}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Condition</p>
                        <p className="font-medium">{condition}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Item Value</p>
                        <p className="font-medium">${item.stat?.value || 0}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Market Value</p>
                        <p className="font-medium text-green-600">${marketValue}</p>
                    </div>
                </div>
                
                {wear > 0 && (
                    <>
                        <Separator />
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Wear Level</p>
                            <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full" 
                                    style={{ width: `${wear * 100}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{(wear * 100).toFixed(1)}% worn</p>
                        </div>
                    </>
                )}
                
                <Separator />
                
                <div className="text-xs text-muted-foreground">
                    <p>• Right-click for quick actions</p>
                    <p>• Drag to equip or reorder items</p>
                    <p>• Click to select item</p>
                </div>
            </div>
        );
    };

    const renderInventoryGrid = (items: InventoryItem[], onSelect?: (item: InventoryItem) => void, selectedIds?: Set<string>) => {
        const totalSlots = getInventorySlots(userLevel);
        const totalPages = Math.ceil(totalSlots / SLOTS_PER_PAGE);
        const startIndex = (currentPage - 1) * SLOTS_PER_PAGE;
        const endIndex = Math.min(startIndex + SLOTS_PER_PAGE, totalSlots);
        const slotsOnCurrentPage = endIndex - startIndex;
        
        return (
            <div className="flex-grow bg-card/50 rounded-lg border border-white/10 h-[500px] flex flex-col">
            <div className="p-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        {items.length} / {totalSlots} slots (Level {userLevel})
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                ←
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                            >
                                →
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            <ScrollArea className="flex-1 p-4">
                <TooltipProvider delayDuration={200}>
                   <div className="grid grid-cols-8 gap-2">
                    {Array.from({ length: slotsOnCurrentPage }).map((_, index) => {
                      const globalIndex = startIndex + index;
                      const item = items[globalIndex];
                      if (!item) {
                        return <div key={`empty-${globalIndex}`} className="aspect-square rounded-lg bg-secondary/20 border border-dashed border-white/10" />;
                      }
                  
                  const isSelected = selectedIds?.has(item.id);

                  return (
                    <AlertDialog key={item.id}>
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Card
                                  draggable
                                  data-inventory-slot={item.id}
                                  onDragStart={(e) => handleDragStart(e, item)}
                                  onDragOver={(e) => handleDragOver(e, item)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, item)}
                                  onDragEnd={handleDragEnd}
                                  onTouchStart={(e) => handleTouchStart(e, item)}
                                  onTouchMove={handleTouchMove}
                                  onTouchEnd={handleTouchEnd}
                                  onClick={(e) => {
                                    if (e.ctrlKey || e.metaKey) {
                                      // Multi-select with Ctrl/Cmd
                                      const newSelected = new Set(selectedIds);
                                      if (newSelected.has(item.id)) {
                                        newSelected.delete(item.id);
                                      } else {
                                        newSelected.add(item.id);
                                      }
                                      setSelectedIds(newSelected);
                                    } else if (onSelect) {
                                      onSelect(item);
                                    }
                                  }}
                                  onContextMenu={(e) => {
                                      if (onSelect) e.preventDefault();
                                  }}
                                  className={cn(
                                    'overflow-hidden group bg-secondary/50 border transition-all aspect-square flex items-center justify-center relative rounded-lg p-1',
                                    onSelect ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
                                    draggedItem?.id === item.id ? 'opacity-50 scale-95' : '',
                                    dragOverId === item.id ? 'border-primary scale-105 shadow-lg shadow-primary/25' : 'border-transparent',
                                    isSelected ? 'border-primary' : selectedIds?.has(item.id) ? 'border-blue-500 bg-blue-500/10' : 'border-transparent hover:border-primary/50',
                                    rarityGlow[item.rarity],
                                    isDragging && draggedItem?.id === item.id ? 'z-50' : ''
                                  )}
                                >
                                  <img
                                    src={getItemImageUrl(item.name, item.type, item.image)}
                                    alt={item.name}
                                    className="w-14 h-10 object-contain transition-transform group-hover:scale-110 pointer-events-none"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      if (target.src.indexOf('/assets/placeholder.svg') === -1) {
                                        target.src = '/assets/placeholder.svg';
                                      }
                                    }}
                                  />
                                </Card>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-background border-primary p-0">
                              {renderAdvancedTooltip(item)}
                            </TooltipContent>
                          </Tooltip>
                           <DropdownMenuContent className="w-48" onContextMenu={(e) => e.preventDefault()}>
                            <DropdownMenuItem onClick={() => handleEquip(item)} disabled={isEquipping}>
                               <Replace className="mr-2 h-4 w-4" />
                               <span>{isEquipping ? 'Equipping...' : 'Equip'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSell(item)}>
                              <DollarSign className="w-4 h-4 mr-2" />
                              <span>Sell</span>
                            </DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className='text-red-500 focus:text-red-500'>
                                   <Trash2 className="mr-2 h-4 w-4" />
                                   <span>Delete</span>
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                         <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the item
                              <span className='font-bold'> {item.name} </span>
                              from your inventory.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                              onClick={() => handleDelete(item)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  );
                })}
              </div>
            </TooltipProvider>
          </ScrollArea>
        </div>
        );
    };
    


  // Show loading state while checking authentication
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Please log in to view your inventory</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 h-full p-4 sm:p-6 lg:p-8 gap-6">
      {/* Drag Preview */}
      <div
        ref={dragPreviewRef}
        className="fixed pointer-events-none z-[9999] opacity-90 transform -translate-x-1/2 -translate-y-1/2"
        style={{ display: 'none' }}
      >
        <div className="w-16 h-16 bg-secondary border-2 border-primary rounded-lg flex items-center justify-center shadow-lg">
          {draggedItem && (
            <img
              src={getItemImageUrl(draggedItem.name, draggedItem.type, draggedItem.image)}
              alt={draggedItem.name}
              className="w-12 h-12 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src.indexOf('/assets/placeholder.svg') === -1) {
                  target.src = '/assets/placeholder.svg';
                }
              }}
            />
          )}
        </div>
      </div>
      {/* Left Column - Equipped Items Only */}
      <aside className="xl:col-span-1 flex flex-col gap-6">
        {/* Mini Profile Hover Card */}
        <div className="bg-card/50 rounded-lg border border-white/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {user?.displayName?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-sm">{user?.displayName || 'User'}</h3>
              <p className="text-xs text-muted-foreground">Level {userLevel}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Coins</span>
              <span className="font-medium text-green-500">
                {balance?.coins?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Gems</span>
              <span className="font-medium text-yellow-500">
                {balance?.gems?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Items</span>
              <span className="font-medium">{localInventory.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Value</span>
              <span className="font-medium text-yellow-500">
                ${(inventoryStats?.totalValue || 0).toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>XP Progress</span>
                <span>185 / 1000</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: '18.5%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold font-headline mb-4">Equipped</h2>
          <div className="space-y-2">
          {Object.values(equippedSlotsConfig).map((slot) => {
            const item = equippedItems[slot.id];
            const iconMap = {
              primary: Target,
              secondary: Shield,
              knife: Sword,
              gloves: Hand,
              agent: User,
            };
            const IconComponent = iconMap[slot.id as keyof typeof iconMap];
            return (
              <div
                key={slot.id}
                className={cn(
                  "bg-card/50 p-2 rounded-lg flex items-center gap-3 h-16 border border-transparent hover:border-primary/50 transition-all",
                  dragOverSlot === slot.id ? 'border-primary bg-primary/10 scale-105 shadow-lg shadow-primary/25' : ''
                )}
                onDragOver={(e) => handleEquipSlotDragOver(e, slot.id)}
                onDrop={(e) => handleEquipSlotDrop(e, slot.id)}
                onDragLeave={handleEquipSlotDragLeave}
                data-equip-slot={slot.id}
              >
                <div className="w-16 h-full bg-secondary/50 rounded-md flex items-center justify-center relative overflow-hidden">
                  {item ? (
                    <img
                      src={getItemImageUrl(item.name, item.type, item.image)}
                      alt={item.name}
                      className="w-16 h-12 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src.indexOf('/assets/placeholder.svg') === -1) {
                          target.src = '/assets/placeholder.svg';
                        }
                      }}
                    />
                  ) : (
                    IconComponent && <IconComponent className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{item ? item.name : 'Empty'}</p>
                  <p className="text-xs text-muted-foreground">{slot.name}</p>
                </div>
              </div>
            );
          })}
          </div>
        </div>
        
        {/* Inventory Progression */}
        <InventoryLevelProgression 
          currentLevel={userLevel} 
          currentSlots={getInventorySlots(userLevel)} 
        />
      </aside>

      {/* Right Column - Compact Stats & Tabs */}
      <main className="xl:col-span-2 flex flex-col gap-4">
        {/* Compact Stats Bar */}
        <div className="bg-card/50 rounded-lg border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{localInventory.length}</p>
                <p className="text-xs text-muted-foreground">Items</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">${(inventoryStats?.totalValue || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Value</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#d32ce6]">{inventoryStats?.rarityBreakdown?.Legendary || 0}</p>
                <p className="text-xs text-muted-foreground">Legendary</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#8847ff]">{inventoryStats?.rarityBreakdown?.Epic || 0}</p>
                <p className="text-xs text-muted-foreground">Epic</p>
              </div>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            )}
          </div>
        </div>


        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="trade-up">Trade-Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="mt-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="Pistol">Pistols</TabsTrigger>
                <TabsTrigger value="Rifle">Rifles</TabsTrigger>
                <TabsTrigger value="SMG">SMGs</TabsTrigger>
                <TabsTrigger value="Heavy">Heavy</TabsTrigger>
                <TabsTrigger value="Knife">Knives</TabsTrigger>
                <TabsTrigger value="Gloves">Gloves</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-6">
                {renderInventoryGrid(localInventory, undefined, new Set())}
              </TabsContent>
              {['Pistol','Rifle','SMG','Heavy','Knife','Gloves'].map((category) => (
                <TabsContent key={category} value={category} className="mt-6">
                    {renderInventoryGrid(localInventory.filter(i => i.type === category), undefined, new Set())}
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
          
          <TabsContent value="trade-up" className="mt-6">
              <TradeUp 
                inventory={localInventory}
                onTradeUpComplete={handleTradeUpComplete}
              />
          </TabsContent>
        </Tabs>
      </main>

      {/* Item Action Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Item Actions</DialogTitle>
            <DialogDescription>
              What would you like to do with {selectedItem?.name}?
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="flex items-center space-x-4 p-4 bg-card/50 rounded-lg">
              <div className="relative">
                <img
                  src={getItemImageUrl(selectedItem.name, selectedItem.type, selectedItem.image)}
                  alt={selectedItem.name}
                  className="w-16 h-12 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.indexOf('/assets/placeholder.svg') === -1) {
                      target.src = '/assets/placeholder.svg';
                    }
                  }}
                />
                <div className={cn(
                  "absolute inset-0 rounded opacity-30",
                  rarityGlow[selectedItem.rarity as Rarity]
                )} />
              </div>
              <div>
                <h4 className="font-semibold">{selectedItem.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedItem.type}</p>
                <Badge variant="outline" className={cn(
                  "text-xs mt-1",
                  rarityBorders[selectedItem.rarity].replace('border-', 'border-'),
                  rarityColors[selectedItem.rarity]
                )}>
                  {selectedItem.rarity}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={() => {
                if (selectedItem) {
                  handleEquip(selectedItem);
                  setShowItemDialog(false);
                }
              }}
              disabled={isEquipping}
              className="w-full sm:w-auto"
            >
              {isEquipping ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Equipping...
                </>
              ) : (
                'Equip'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedItem) {
                  handleSell(selectedItem);
                  setShowItemDialog(false);
                }
              }}
              className="w-full sm:w-auto"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Sell
            </Button>
            <Button
               variant="destructive"
               onClick={() => {
                 if (selectedItem) {
                   handleDelete(selectedItem);
                   setShowItemDialog(false);
                 }
               }}
               className="w-full sm:w-auto"
             >
               <Trash2 className="w-4 h-4 mr-2" />
               Delete
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    