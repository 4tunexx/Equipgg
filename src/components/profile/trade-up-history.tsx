
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tradeUpHistoryData } from "@/lib/mock-data";
import Image from "next/image";
import ItemImage from "@/components/ItemImage";

import { rarityColors } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function TradeUpHistory() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Trade-Up History</CardTitle>
                <CardDescription>A record of your past trade-up contracts.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Items Used</TableHead>
                            <TableHead>Item Received</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tradeUpHistoryData.map((trade) => (
                            <TableRow key={trade.id}>
                                <TableCell className="font-mono text-xs">{trade.date}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        {trade.usedItems.map((item) => (
                                            <ItemImage 
                                                key={item.id} 
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
                                        <span className={cn("font-semibold", rarityColors[trade.receivedItem.rarity])}>{trade.receivedItem.name}</span>
                                     </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
