'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { useAuth } from "../../../hooks/use-auth";
import { useToast } from "../../../hooks/use-toast";
import { Plus, RefreshCw, Check, X, Loader2, Send } from 'lucide-react';
import { cn } from "../../../lib/utils";
import { rarityColors } from "../../../lib/types";

interface InventoryItem {
  id: string;
  item_name?: string;
  name?: string;
  item_type?: string;
  type?: string;
  rarity: string;
  image_url?: string;
  image?: string;
  value?: number;
  equipped: boolean;
}

interface Trade {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  sender_items: string[];
  receiver_items: string[];
  status: string;
  created_at: string;
  sender: {
    id: string;
    displayname: string;
    avatar_url: string;
  };
  receiver?: {
    id: string;
    displayname: string;
    avatar_url: string;
  };
  senderItemsDetails: InventoryItem[];
  offeredItemsDetails?: InventoryItem[];
  requestedItemsDetails?: InventoryItem[];
}

// Helper function to generate image URLs (same as inventory/shop/admin)
const getItemImageUrl = (itemName: string, category: string, existingImage?: string) => {
  if (existingImage && !existingImage.includes('placeholder')) return existingImage;
  
  const baseUrl = 'https://www.csgodatabase.com/images';
  const categoryLower = category?.toLowerCase() || '';
  const nameLower = itemName?.toLowerCase() || '';
  
  let folder = 'skins';
  if (categoryLower.includes('knife') || nameLower.includes('knife')) folder = 'knives';
  else if (categoryLower.includes('glove')) folder = 'gloves';
  else if (categoryLower.includes('agent')) folder = 'agents';
  
  const cleanName = itemName?.replace(/\s*\|?\s*StatTrak™?\s*/gi, '').trim() || 'unknown';
  const formattedName = cleanName.replace(/\s+/g, '_');
  
  return `${baseUrl}/${folder}/webp/${formattedName}.webp`;
};

export default function TradingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('open');
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [myTrades, setMyTrades] = useState<Trade[]>([]);
  const [myInventory, setMyInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [offerItemId, setOfferItemId] = useState<string>('');

  // Fetch user's inventory
  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory', { credentials: 'include' });
      const data = await res.json();
      console.log('📦 Inventory API Response:', data);
      if (data.success) {
        console.log('📦 Inventory Items:', data.inventory);
        console.log('📦 First Item:', data.inventory?.[0]);
        setMyInventory(data.inventory || []);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  };

  // Fetch open trades
  const fetchOpenTrades = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trades/open', { credentials: 'include' });
      const data = await res.json();
      console.log('📦 Open Trades Response:', data);
      if (data.success) {
        console.log('📦 First Trade:', data.trades?.[0]);
        console.log('📦 First Trade Items:', data.trades?.[0]?.senderItemsDetails);
        // Filter out expired trades (older than 1 hour with no offer)
        const now = Date.now();
        const validTrades = (data.trades || []).filter((trade: Trade) => {
          const createdAt = new Date(trade.created_at).getTime();
          const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);
          // If open and older than 1 hour, skip it
          if (trade.status === 'open' && hoursSinceCreated > 1) {
            return false;
          }
          return true;
        });
        setOpenTrades(validTrades);
      }
    } catch (error) {
      console.error('Failed to fetch open trades:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch my trades
  const fetchMyTrades = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trades?type=sent', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setMyTrades(data.trades || []);
      }
    } catch (error) {
      console.error('Failed to fetch my trades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInventory();
      fetchOpenTrades();
      fetchMyTrades();
    }
  }, [user]);

  // Create trade
  const handleCreateTrade = async () => {
    if (!selectedItem) {
      toast({
        title: "Error",
        description: "Please select an item to trade",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await fetch('/api/trades/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: selectedItem })
      });

      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "Trade Created!",
          description: data.message
        });
        setIsCreateOpen(false);
        setSelectedItem('');
        fetchMyTrades();
        fetchOpenTrades();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create trade",
        variant: "destructive"
      });
    }
  };

  // Make offer on trade
  const handleMakeOffer = async () => {
    if (!selectedTrade || !offerItemId) {
      toast({
        title: "Error",
        description: "Please select an item to offer",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await fetch(`/api/trades/${selectedTrade.id}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: offerItemId })
      });

      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "Offer Sent!",
          description: data.message
        });
        setIsOfferOpen(false);
        setOfferItemId('');
        setSelectedTrade(null);
        fetchOpenTrades();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send offer",
        variant: "destructive"
      });
    }
  };

  // Accept trade
  const handleAccept = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}/accept`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "Trade Accepted!",
          description: "Items have been swapped successfully"
        });
        fetchMyTrades();
        fetchInventory();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept trade",
        variant: "destructive"
      });
    }
  };

  // Decline trade
  const handleDecline = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}/decline`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "Trade Declined",
          description: "The offer has been declined"
        });
        fetchMyTrades();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline trade",
        variant: "destructive"
      });
    }
  };

  // Cancel trade
  const handleCancel = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });

      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "Trade Cancelled",
          description: "Your trade has been cancelled"
        });
        fetchMyTrades();
        fetchOpenTrades();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel trade",
        variant: "destructive"
      });
    }
  };

  const unequippedItems = (myInventory || []).filter(item => !item.equipped);

  return (
    <div className="container mx-auto max-w-7xl py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trading</h1>
          <p className="text-muted-foreground">Trade items with other players</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchOpenTrades(); fetchMyTrades(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Trade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Trade Listing</DialogTitle>
                <DialogDescription>
                  Select ONE item from your inventory to trade
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an item to trade" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-72">
                      {unequippedItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-4">No unequipped items available</p>
                      ) : (
                        unequippedItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            <div className="flex items-center gap-2">
                              <span className={cn("font-medium", rarityColors[item.rarity as keyof typeof rarityColors] || "text-foreground")}>
                                {item.item_name || item.name || 'Unknown Item'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {item.value ? `($${item.value})` : ''}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTrade}>
                  <Send className="w-4 h-4 mr-2" />
                  Create Trade
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="open">Open Trades</TabsTrigger>
          <TabsTrigger value="my">My Trades</TabsTrigger>
        </TabsList>

        {/* Open Trades */}
        <TabsContent value="open" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : openTrades.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No open trades available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openTrades.map((trade) => (
                <Card key={trade.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={trade.sender.avatar_url} />
                        <AvatarFallback>{trade.sender.displayname.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{trade.sender.displayname}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {new Date(trade.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Offering:</p>
                      {(trade.senderItemsDetails || []).map((item) => {
                        const imageUrl = getItemImageUrl(item.item_name || '', item.item_type || item.type || 'weapon', item.image_url || item.image);
                        return (
                          <div key={item.id} className="flex items-center gap-3 p-2 bg-secondary/50 rounded">
                            <img src={imageUrl} alt={item.item_name || ''} className="w-16 h-12 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            <div className="flex-1">
                              <p className={cn("text-sm font-medium", rarityColors[item.rarity as keyof typeof rarityColors])}>
                                {item.item_name || 'Unknown Item'}
                              </p>
                              <p className="text-xs text-muted-foreground">${item.value || 0}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        setSelectedTrade(trade);
                        setIsOfferOpen(true);
                      }}
                    >
                      Make Offer
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Trades */}
        <TabsContent value="my" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : myTrades.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-muted-foreground">You haven't created any trades yet</p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Trade
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myTrades.map((trade) => (
                <Card key={trade.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>{trade.status}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(trade.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <p className="text-xs text-muted-foreground mb-2">Your Item:</p>
                            {(trade.offeredItemsDetails || trade.senderItemsDetails || []).map((item) => {
                              const imageUrl = getItemImageUrl(item.item_name || '', item.item_type || item.type || 'weapon', item.image_url || item.image);
                              return (
                                <div key={item.id} className="flex items-center gap-3">
                                  <img src={imageUrl} alt={item.item_name || ''} className="w-16 h-12 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                  <div>
                                    <p className={cn("text-sm font-medium", rarityColors[item.rarity as keyof typeof rarityColors])}>
                                      {item.item_name || 'Unknown Item'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">${item.value || 0}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {trade.status === 'pending' && trade.receiver_id && (
                            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-xs text-muted-foreground">Offer from:</p>
                                <p className="text-sm font-semibold text-green-400">{trade.receiver?.displayname || 'Unknown User'}</p>
                              </div>
                              {(trade.requestedItemsDetails || []).map((item) => {
                                const imageUrl = getItemImageUrl(item.item_name || '', item.item_type || item.type || 'weapon', item.image_url || item.image);
                                return (
                                  <div key={item.id} className="flex items-center gap-3 mb-2">
                                    <img src={imageUrl} alt={item.item_name || ''} className="w-16 h-12 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    <div>
                                      <p className={cn("text-sm font-medium", rarityColors[item.rarity as keyof typeof rarityColors])}>
                                        {item.item_name || 'Unknown Item'}
                                      </p>
                                      <p className="text-xs text-muted-foreground">${item.value || 0}</p>
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="flex gap-2 mt-3">
                                <Button size="sm" onClick={() => handleAccept(trade.id)}>
                                  <Check className="w-4 h-4 mr-1" />
                                  Accept Trade
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDecline(trade.id)}>
                                  <X className="w-4 h-4 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {trade.status === 'open' && (
                        <Button variant="destructive" size="sm" onClick={() => handleCancel(trade.id)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Make Offer Dialog */}
      <Dialog open={isOfferOpen} onOpenChange={setIsOfferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make an Offer</DialogTitle>
            <DialogDescription>
              Select an item from your inventory to offer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={offerItemId} onValueChange={setOfferItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Select your item" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-72">
                  {unequippedItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4">No unequipped items available</p>
                  ) : (
                    unequippedItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex items-center gap-2">
                          <span className={cn("font-medium", rarityColors[item.rarity as keyof typeof rarityColors] || "text-foreground")}>
                            {item.item_name || item.name || 'Unknown Item'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.value ? `($${item.value})` : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOfferOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMakeOffer}>
              <Send className="w-4 h-4 mr-2" />
              Send Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
