'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { useAuth } from "../../../hooks/use-auth";
import { useToast } from "../../../hooks/use-toast";
import { 
  Send, 
  Clock, 
  Check, 
  X, 
  Eye, 
  Plus,
  RefreshCw,
  ArrowLeftRight,
  Filter,
  Star,
  MessageCircle
} from 'lucide-react';
import ItemImage from "../../../components/ItemImage";
import { InventoryItem } from "../../../lib/types";
import { cn } from "../../../lib/utils";

interface TradeOffer {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  offeredItems: InventoryItem[];
  requestedItems: InventoryItem[];
  message?: string;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
}

interface TradingUser {
  id: string;
  displayName: string;
  avatar?: string;
  level: number;
  reputation: number;
  isOnline: boolean;
  recentItems: InventoryItem[];
  totalTrades: number;
  successRate: number;
}

export default function TradingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('browse');
  const [tradeOffers, setTradeOffers] = useState<TradeOffer[]>([]);
  const [tradingUsers, setTradingUsers] = useState<TradingUser[]>([]);
  const [userInventory, setUserInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);
  
  // Create offer state
  const [newOffer, setNewOffer] = useState({
    targetUserId: '',
    message: '',
    offeredItems: [] as string[],
    requestedItems: [] as string[]
  });

  const fetchTradeOffers = useCallback(async () => {
    try {
      setLoading(true);
      // Mock data for now
      setTradeOffers([
        {
          id: '1',
          senderId: 'user1',
          senderName: 'TraderPro',
          receiverId: user?.id || '',
          receiverName: user?.displayName || '',
          status: 'pending',
          offeredItems: [
            {
              id: '1',
              name: 'AK-47 | Redline',
              type: 'Rifle',
              rarity: 'Rare',
              image: '',
              dataAiHint: 'cs2 rifle skin'
            }
          ],
          requestedItems: [
            {
              id: '2',
              name: 'AWP | Asiimov',
              type: 'Rifle',
              rarity: 'Rare',
              image: '',
              dataAiHint: 'cs2 rifle skin'
            }
          ],
          message: 'Fair trade for your AWP Asiimov?',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    } catch {
      console.error('Error fetching trade offers');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.displayName]);

  const fetchTradingUsers = useCallback(async () => {
    try {
      // Mock data for now
      setTradingUsers([
        {
          id: 'trader1',
          displayName: 'SkinCollector',
          level: 25,
          reputation: 4.8,
          isOnline: true,
          recentItems: [],
          totalTrades: 156,
          successRate: 98.2
        },
        {
          id: 'trader2',
          displayName: 'KnifeExpert',
          level: 30,
          reputation: 4.9,
          isOnline: false,
          recentItems: [],
          totalTrades: 203,
          successRate: 99.1
        }
      ]);
    } catch {
      console.error('Error fetching trading users');
    }
  }, []);

  const fetchUserInventory = useCallback(async () => {
    try {
      // Mock inventory data
      setUserInventory([
        {
          id: '1',
          name: 'AWP | Asiimov',
          type: 'Rifle',
          rarity: 'Rare',
          image: '',
          dataAiHint: 'cs2 rifle skin'
        },
        {
          id: '2',
          name: 'Karambit | Fade',
          type: 'Knife',
          rarity: 'Legendary',
          image: '',
          dataAiHint: 'cs2 knife skin'
        }
      ]);
    } catch {
      console.error('Error fetching inventory');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTradeOffers();
      fetchTradingUsers();
      fetchUserInventory();
    }
  }, [user, fetchTradeOffers, fetchTradingUsers, fetchUserInventory]);

  const handleAcceptOffer = async (offerId: string) => {
    try {
      toast({
        title: "Trade Accepted",
        description: "The trade offer has been accepted successfully!",
      });
      // Update offer status
      setTradeOffers(prev => prev.map(offer => 
        offer.id === offerId ? { ...offer, status: 'accepted' as const } : offer
      ));
    } catch {
      toast({
        title: "Error",
        description: "Failed to accept trade offer",
        variant: "destructive"
      });
    }
  };

  const handleDeclineOffer = async (offerId: string) => {
    try {
      toast({
        title: "Trade Declined",
        description: "The trade offer has been declined.",
      });
      setTradeOffers(prev => prev.map(offer => 
        offer.id === offerId ? { ...offer, status: 'declined' as const } : offer
      ));
    } catch {
      toast({
        title: "Error",
        description: "Failed to decline trade offer",
        variant: "destructive"
      });
    }
  };

  const handleCreateOffer = async () => {
    if (!newOffer.targetUserId || newOffer.offeredItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select a user and items to trade",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Info",
        description: "Trading API is not yet implemented. This is a preview of the trading interface.",
      });
      setIsCreateOfferOpen(false);
      setNewOffer({
        targetUserId: '',
        message: '',
        offeredItems: [],
        requestedItems: []
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to create trade offer",
        variant: "destructive"
      });
    }
  };

  const filteredOffers = tradeOffers.filter(offer => {
    if (filterStatus !== 'all' && offer.status !== filterStatus) return false;
    if (searchTerm && !offer.senderName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status: TradeOffer['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'accepted': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'declined': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'cancelled': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'expired': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">P2P Trading</h1>
          <p className="text-muted-foreground">Trade items directly with other players</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {user && (
            <Dialog open={isCreateOfferOpen} onOpenChange={setIsCreateOfferOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Offer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Create Trade Offer</DialogTitle>
                  <DialogDescription>
                    Select items to offer and request from another player
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Your Items</h4>
                    <div className="grid grid-cols-3 gap-2 h-48 overflow-y-auto border rounded p-2">
                      {userInventory.map((item) => (
                        <Card 
                          key={item.id} 
                          className={cn(
                            "p-2 cursor-pointer transition-all",
                            newOffer.offeredItems.includes(item.id) && "ring-2 ring-primary"
                          )}
                          onClick={() => {
                            setNewOffer(prev => ({
                              ...prev,
                              offeredItems: prev.offeredItems.includes(item.id)
                                ? prev.offeredItems.filter(id => id !== item.id)
                                : [...prev.offeredItems, item.id]
                            }));
                          }}
                        >
                          <ItemImage
                            itemName={item.name}
                            itemType={item.type as 'skins' | 'knives' | 'gloves' | 'agents'}
                            width={48}
                            height={36}
                            className="mx-auto"
                          />
                          <p className="text-xs text-center mt-1 truncate">{item.name}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Target User</h4>
                    <Select value={newOffer.targetUserId} onValueChange={(value) => setNewOffer(prev => ({ ...prev, targetUserId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {tradingUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", user.isOnline ? "bg-green-500" : "bg-gray-500")} />
                              {user.displayName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Message (Optional)</h4>
                      <Textarea
                        placeholder="Add a message to your trade offer..."
                        value={newOffer.message}
                        onChange={(e) => setNewOffer(prev => ({ ...prev, message: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOfferOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOffer}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Offer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Browse Traders</TabsTrigger>
          <TabsTrigger value="incoming">Incoming Offers</TabsTrigger>
          <TabsTrigger value="outgoing">Outgoing Offers</TabsTrigger>
          <TabsTrigger value="history">Trade History</TabsTrigger>
        </TabsList>

        {/* Browse Traders */}
        <TabsContent value="browse" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Traders</CardTitle>
              <CardDescription>Find players to trade with</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search traders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tradingUsers.map((trader) => (
                  <Card key={trader.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={trader.avatar} />
                            <AvatarFallback>{trader.displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                            trader.isOnline ? "bg-green-500" : "bg-gray-500"
                          )} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{trader.displayName}</h3>
                          <p className="text-sm text-muted-foreground">Level {trader.level}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Reputation:</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{trader.reputation}/5.0</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Trades:</span>
                          <span>{trader.totalTrades}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <span>{trader.successRate}%</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" className="flex-1">
                          <Eye className="w-3 h-3 mr-1" />
                          View Profile
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incoming Offers */}
        <TabsContent value="incoming" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Incoming Trade Offers</CardTitle>
              <CardDescription>Review offers from other players</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Input
                  placeholder="Search offers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredOffers.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowLeftRight className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No trade offers found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOffers.map((offer) => (
                    <Card key={offer.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={offer.senderAvatar} />
                              <AvatarFallback>{offer.senderName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{offer.senderName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(offer.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(offer.status)}>
                            {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium mb-2 text-green-600">They Offer:</h4>
                            <div className="flex gap-2 flex-wrap">
                              {offer.offeredItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-2 bg-green-500/10 p-2 rounded">
                                  <ItemImage
                                    itemName={item.name}
                                    itemType={item.type as 'skins' | 'knives' | 'gloves' | 'agents'}
                                    width={32}
                                    height={24}
                                  />
                                  <span className="text-xs">{item.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2 text-blue-600">They Want:</h4>
                            <div className="flex gap-2 flex-wrap">
                              {offer.requestedItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-2 bg-blue-500/10 p-2 rounded">
                                  <ItemImage
                                    itemName={item.name}
                                    itemType={item.type as 'skins' | 'knives' | 'gloves' | 'agents'}
                                    width={32}
                                    height={24}
                                  />
                                  <span className="text-xs">{item.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {offer.message && (
                          <div className="bg-muted/50 p-3 rounded mb-4">
                            <p className="text-sm">{offer.message}</p>
                          </div>
                        )}

                        {offer.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleAcceptOffer(offer.id)}
                              className="flex-1"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Accept
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => handleDeclineOffer(offer.id)}
                              className="flex-1"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outgoing Offers */}
        <TabsContent value="outgoing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Outgoing Trade Offers</CardTitle>
              <CardDescription>Track offers you&apos;ve sent to other players</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Send className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No outgoing offers yet</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setIsCreateOfferOpen(true)}
                >
                  Create Your First Offer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trade History */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>View your completed trades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No completed trades yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start trading to build your trade history!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}