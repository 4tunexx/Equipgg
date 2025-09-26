
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

import ItemImage from "../ItemImage";
import { cn } from "../../lib/utils";

// Local rarity colors until we get them from Supabase
const rarityColors = {
  'Consumer Grade': 'text-gray-400',
  'Industrial Grade': 'text-blue-400',
  'Mil-Spec': 'text-purple-400',
  'Restricted': 'text-pink-400',
  'Classified': 'text-red-400',
  'Covert': 'text-orange-400'
};

// Type definitions
type TradeUpItem = {
  id?: string;
  name: string;
  rarity: string;
  type: string;
  dataAiHint?: string;
};

type TradeUpHistoryItem = {
  id: string;
  date: string;
  usedItems: TradeUpItem[];
  receivedItem: TradeUpItem;
};

export function TradeUpHistory() {
    // Mock data for trade-up history - replace with Supabase queries later
    const tradeUpHistoryData: TradeUpHistoryItem[] = [
        {
            id: '1',
            date: '2024-07-28',
            usedItems: [],
            receivedItem: { name: 'AK-47 | Redline', rarity: 'Classified', type: 'skins' }
        }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Trade-Up History</CardTitle>
                <CardDescription>A record of your past trade-up contracts.</CardDescription>
            </CardHeader>
            <CardContent>
                {tradeUpHistoryData.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        No trade-up history available.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Items Used</TableHead>
                                <TableHead>Item Received</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tradeUpHistoryData.map((trade: TradeUpHistoryItem) => (
                                <TableRow key={trade.id}>
                                    <TableCell className="font-mono text-xs">{trade.date}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            {trade.usedItems.map((item: TradeUpItem) => (
                                                <ItemImage 
                                                    key={item.id || item.name} 
                                                    itemName={item.name}
                                                    itemType={item.type as 'skins' | 'knives' | 'gloves' | 'agents'}
                                                    width={24} 
                                                    height={24}
                                                    className="rounded-sm"
                                                />
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                         <div className="flex items-center gap-2">
                                            <ItemImage 
                                                itemName={trade.receivedItem.name}
                                                itemType={trade.receivedItem.type as 'skins' | 'knives' | 'gloves' | 'agents'}
                                                width={32} 
                                                height={32}
                                                className="rounded-md bg-secondary/50 p-1"
                                                data-ai-hint={trade.receivedItem.dataAiHint}
                                            />
                                            <span className={cn("font-semibold", rarityColors[trade.receivedItem.rarity as keyof typeof rarityColors] || 'text-gray-400')}>{trade.receivedItem.name}</span>
                                         </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
