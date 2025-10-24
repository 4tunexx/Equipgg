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
  item_id?: string;
  item_name?: string;
  name?: string;
  item_type?: string;
  type?: string;
  rarity: string;
  image_url?: string;
  image?: string;
  value?: number;
  equipped: boolean;
  quantity?: number;
}

interface Trade {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  sender_items: string[];
  receiver_items: string[];
  status: string;
  created_at: string;
  expires_at: string;
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

// Helper function to generate image URLs
const getItemImageUrl = (itemName: string, category: string, existingImage?: string) => {
  // Use existing image if valid
  if (existingImage && !existingImage.includes('placeholder') && existingImage.startsWith('http')) {
    return existingImage;
  }
  
  // If no name, return placeholder immediately
  if (!itemName || itemName === 'Unknown Item' || itemName.trim() === '') {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiMzMzMiLz48cGF0aCBkPSJNMzIgMjBWNDRNMjAgMzJINDQiIHN0cm9rZT0iIzY2NiIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=';
  }
  
  // Use CS:GO Database for weapon skins
  const cleanName = itemName.replace(/\s*\|?\s*StatTrak™?\s*/gi, '').trim();
  const formattedName = cleanName.replace(/\s+/g, '_');
  
  return `https://www.csgodatabase.com/images/skins/webp/${formattedName}.webp`;
};

// Timer removed per user request

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
      console.log('🔥 Fetching OPEN TRADES from API...');
      const res = await fetch('/api/trades/open', { credentials: 'include' });
      
      console.log('🔍 Response status:', res.status);
      console.log('🔍 Response headers:', res.headers.get('content-type'));
      
      // Check if response is actually JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('❌ API returned non-JSON response:', text.substring(0, 500));
        toast({
          title: "Error",
          description: "API error - check console",
          variant: "destructive"
        });
        return;
      }
      
      const data = await res.json();
      console.log('📦 Open Trades API Response:', data);
      console.log('📦 Total trades from API:', data.trades?.length);
      
      if (data.success) {
        if (data.trades && data.trades.length > 0) {
          console.log('📦 First Trade Full Details:', data.trades[0]);
          console.log('📦 First Trade expires_at:', data.trades[0]?.expires_at);
          console.log('📦 First Trade created_at:', data.trades[0]?.created_at);
          console.log('📦 First Trade Items:', data.trades[0]?.senderItemsDetails);
        } else {
          console.log('⚠️ NO TRADES RETURNED FROM API!');
        }
        
        // Filter out expired and cancelled trades
        const now = Date.now();
        console.log('🔍 Frontend filtering - current time:', new Date(now).toISOString());
        
        console.log('⚠️ FRONTEND FILTERS TEMPORARILY DISABLED FOR DEBUGGING');
        
        const validTrades = (data.trades || []).filter((trade: Trade) => {
          // Skip cancelled or rejected trades
          if (trade.status === 'cancelled' || trade.status === 'rejected') {
            console.log('❌ Filtered out cancelled/rejected trade:', trade.id);
            return false;
          }
          
          // TEMPORARILY DISABLED EXPIRATION CHECK
          // if (trade.expires_at) {
          //   const expiresAt = new Date(trade.expires_at).getTime();
          //   const remaining = expiresAt - now;
          //   console.log('⏱️ Trade', trade.id, 'expires_at check:', {
          //     expiresAt: new Date(expiresAt).toISOString(),
          //     remaining: remaining,
          //     isExpired: remaining <= 0
          //   });
          //   
          //   if (expiresAt <= now) {
          //     console.log('❌ Filtered out EXPIRED trade:', trade.id);
          //     return false; // Trade has expired
          //   }
          // }
          
          console.log('✅ Trade', trade.id, 'passed filters!');
          return true;
        });
        
        console.log('📦 Valid trades after filtering:', validTrades.length);
        console.log('🔥 SETTING OPEN TRADES TO:', validTrades);
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
      console.log('👉 Fetching MY TRADES...');
      const res = await fetch('/api/trades?type=sent', { credentials: 'include' });
      const data = await res.json();
      console.log('👉 MY TRADES Response:', data);
      console.log('👉 Total trades received:', data.trades?.length);
      
      if (data.success) {
        // SHOW ALL TRADES - NO FILTERS!
        console.log('👉 Setting myTrades to:', data.trades?.length, 'trades');
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

  // Auto-refresh trades every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOpenTrades();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

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
      console.log('🔥 Creating trade with itemId:', selectedItem);
      
      const res = await fetch('/api/trades/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: selectedItem })
      });

      const data = await res.json();
      console.log('🔥 Trade creation response:', data);
      
      if (data.success) {
        console.log('🔥 Trade created successfully! Trade ID:', data.trade?.id);
        console.log('🔥 Trade expires_at:', data.trade?.expires_at);
        
        toast({
          title: "Trade Created!",
          description: data.message
        });
        setIsCreateOpen(false);
        setSelectedItem('');
        
        // Switch to My Trades tab to show the new trade
        setActiveTab('my-trades');
        
        console.log('🔥 Fetching trades now...');
        // Immediate refresh
        await fetchMyTrades();
        await fetchOpenTrades();
        console.log('🔥 First fetch complete');
        
        // Refresh again after 1 second to ensure new trade shows
        setTimeout(async () => {
          console.log('🔥 Second fetch starting...');
          await fetchMyTrades();
          await fetchOpenTrades();
          console.log('🔥 Second fetch complete');
        }, 1000);
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });

      const data = await res.json();
      
      if (data.success) {
        // Immediately remove from UI
        setMyTrades(prev => prev.filter(t => t.id !== tradeId));
        setOpenTrades(prev => prev.filter(t => t.id !== tradeId));
        
        toast({
          title: "Trade Declined",
          description: "You declined the trade offer"
        });
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
        // Immediately remove from UI
        setMyTrades(prev => prev.filter(t => t.id !== tradeId));
        setOpenTrades(prev => prev.filter(t => t.id !== tradeId));
        
        toast({
          title: "Trade Cancelled",
          description: "Your trade has been cancelled"
        });
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
                      <div className="flex-1">
                        <CardTitle className="text-base">{trade.sender.displayname}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {new Date(trade.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {/* Timer removed */}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Offering:</p>
                      {(trade.senderItemsDetails || []).map((item) => {
                        return (
                          <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                            <div className="w-20 h-16 bg-muted/50 rounded flex items-center justify-center overflow-hidden">
                              <img 
                                src={item.image_url || item.image || `https://community.cloudflare.steamstatic.com/economy/image/${encodeURIComponent(item.item_name || 'CS:GO')}`}
                                alt={item.item_name || item.name || 'Item'} 
                                className="w-full h-full object-contain" 
                                loading="lazy"
                                onError={(e) => { 
                                  const target = e.currentTarget;
                                  if (!target.src.includes('placeholder')) {
                                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiMzMzMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Pz88L3RleHQ+PC9zdmc+';
                                    target.onerror = null;
                                  }
                                }} 
                              />
                            </div>
                            <div className="flex-1">
                              <p className={cn("text-sm font-medium", rarityColors[item.rarity as keyof typeof rarityColors])}>
                                {item.item_name || `Item #${item.item_id || item.id}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ${item.value || 10} • {item.rarity || 'common'}
                              </p>
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
                    <div className="space-y-4">
                      {/* Header with status, timer and cancel button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={trade.status === 'open' ? 'default' : trade.status === 'completed' ? 'outline' : 'secondary'}>
                            {trade.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(trade.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Timer removed */}
                          {trade.status === 'open' && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleCancel(trade.id)}
                              className="h-8"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Trade content */}
                      <div>
                        <div className="space-y-3">
                          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                            <p className="text-xs font-semibold text-foreground mb-3">Your Item:</p>
                            {(trade.offeredItemsDetails || trade.senderItemsDetails || []).map((item) => {
                              return (
                                <div key={item.id} className="flex items-center gap-3">
                                  <div className="w-20 h-16 bg-muted/50 rounded flex items-center justify-center overflow-hidden">
                                    <img 
                                      src={item.image_url || item.image || `https://community.cloudflare.steamstatic.com/economy/image/${encodeURIComponent(item.item_name || item.name || 'CS:GO')}`}
                                      alt={item.item_name || item.name || 'Item'} 
                                      className="w-full h-full object-contain" 
                                      loading="lazy"
                                      onError={(e) => { 
                                        const target = e.currentTarget;
                                        if (!target.src.includes('placeholder')) {
                                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiMzMzMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Pz88L3RleHQ+PC9zdmc+';
                                          target.onerror = null;
                                        }
                                      }} 
                                    />
                                  </div>
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
                            <div className="p-3 bg-muted/30 rounded-lg border border-green-500/30">
                              <div className="flex items-center gap-2 mb-3">
                                <p className="text-xs text-muted-foreground">Offer from:</p>
                                <p className="text-sm font-semibold text-green-400">{trade.receiver?.displayname || 'Unknown User'}</p>
                              </div>
                              {(trade.requestedItemsDetails || []).map((item) => {
                                return (
                                  <div key={item.id} className="flex items-center gap-3 mb-2">
                                    <div className="w-20 h-16 bg-muted/50 rounded flex items-center justify-center overflow-hidden">
                                      <img 
                                        src={item.image_url || item.image || `https://community.cloudflare.steamstatic.com/economy/image/${encodeURIComponent(item.item_name || item.name || 'CS:GO')}`}
                                        alt={item.item_name || item.name || 'Item'} 
                                        className="w-full h-full object-contain" 
                                        loading="lazy"
                                        onError={(e) => { 
                                          const target = e.currentTarget;
                                          if (!target.src.includes('placeholder')) {
                                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiMzMzMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Pz88L3RleHQ+PC9zdmc+';
                                            target.onerror = null;
                                          }
                                        }} 
                                      />
                                    </div>
                                    <div>
                                      <p className={cn("text-sm font-medium", rarityColors[item.rarity as keyof typeof rarityColors])}>
                                        {item.item_name || item.name || 'Unknown Item'}
                                      </p>
                                      <p className="text-xs text-muted-foreground">${item.value || 10}</p>
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
