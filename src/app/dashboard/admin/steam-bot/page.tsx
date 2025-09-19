'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Badge } from "../../../../components/ui/badge";
import { Switch } from "../../../../components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { useToast } from "../../../../hooks/use-toast";
import { 
  Bot, 
  Settings, 
  Package, 
  TrendingUp, 
  Users, 
  Shield,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react";

interface SteamBotConfig {
  id: number;
  bot_enabled: boolean;
  steam_username: string;
  steam_password: string;
  steam_api_key: string;
  steam_id: string;
  trade_offer_url: string;
  inventory_sync_interval: number;
  auto_accept_trades: boolean;
  max_trade_value: number;
  status: string;
  last_sync: string | null;
}

interface InventoryItem {
  id: string;
  steam_asset_id: string;
  name: string;
  market_name: string;
  category: string;
  rarity: string;
  wear: string;
  float_value: number;
  market_price: number;
  gem_price: number;
  status: string;
  image_url: string;
  added_at: string;
}

interface TradeOffer {
  id: string;
  user_id: string;
  item_id: string;
  user_steam_id: string;
  user_trade_url: string;
  gems_paid: number;
  status: string;
  steam_offer_id: string | null;
  created_at: string;
  users?: { username: string; email: string };
  steam_bot_inventory?: { name: string; market_name: string; gem_price: number };
}

export default function SteamBotManagementPage() {
  const [botConfig, setBotConfig] = useState<SteamBotConfig | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [tradeOffers, setTradeOffers] = useState<TradeOffer[]>([]);
  const [inventoryStats, setInventoryStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Dialog states
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Form states
  const [newItem, setNewItem] = useState({
    steam_asset_id: '',
    name: '',
    market_name: '',
    category: 'weapons',
    rarity: 'Common',
    wear: 'Factory New',
    float_value: 0.01,
    market_price: 0,
    gem_price: 0,
    image_url: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [configResponse, inventoryResponse, tradeOffersResponse] = await Promise.all([
        fetch('/api/steam-bot/config'),
        fetch('/api/steam-bot/inventory'),
        fetch('/api/steam-bot/trade-offers?admin=true')
      ]);

      if (configResponse.ok) {
        const configData = await configResponse.json();
        setBotConfig(configData.config);
      }

      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        setInventory(inventoryData.inventory);
        setInventoryStats(inventoryData.stats);
      }

      if (tradeOffersResponse.ok) {
        const tradeOffersData = await tradeOffersResponse.json();
        setTradeOffers(tradeOffersData.trade_offers);
      }

    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load Steam bot data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveBotConfig = async () => {
    if (!botConfig) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/steam-bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botConfig)
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Success",
          description: "Steam bot configuration saved successfully"
        });
        setBotConfig(data.config);
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
        description: "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addInventoryItem = async () => {
    if (!newItem.name || !newItem.market_name || !newItem.gem_price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/steam-bot/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_item',
          data: newItem
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Success",
          description: "Item added to bot inventory"
        });
        setShowAddItemDialog(false);
        setNewItem({
          steam_asset_id: '',
          name: '',
          market_name: '',
          category: 'weapons',
          rarity: 'Common',
          wear: 'Factory New',
          float_value: 0.01,
          market_price: 0,
          gem_price: 0,
          image_url: ''
        });
        loadData();
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
        description: "Failed to add item",
        variant: "destructive"
      });
    }
  };

  const syncInventory = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/steam-bot/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_inventory'
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Success",
          description: `Inventory sync completed. ${data.synced_items} items synced.`
        });
        loadData();
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
        description: "Failed to sync inventory",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const markTradeCompleted = async (tradeOfferId: string, itemId: string) => {
    try {
      const response = await fetch('/api/steam-bot/trade-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_completed',
          data: { trade_offer_id: tradeOfferId, item_id: itemId }
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Success",
          description: "Trade offer marked as completed"
        });
        loadData();
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
        description: "Failed to mark trade as completed",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading Steam bot data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-400" />
            Steam Bot Management
          </h1>
          <p className="text-muted-foreground">Manage Steam bot configuration, inventory, and trade offers</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={botConfig?.bot_enabled ? "default" : "secondary"}>
            {botConfig?.bot_enabled ? "Enabled" : "Disabled"}
          </Badge>
          <Badge variant={botConfig?.status === 'online' ? "default" : "destructive"}>
            {botConfig?.status || "Unknown"}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryStats.total_items || 0}</div>
            <p className="text-xs text-muted-foreground">In bot inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Items</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryStats.available_items || 0}</div>
            <p className="text-xs text-muted-foreground">Ready for trading</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${inventoryStats.total_value || 0}</div>
            <p className="text-xs text-muted-foreground">Market value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Trades</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryStats.pending_trades || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="trades" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Trade Offers
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Steam Bot Configuration</CardTitle>
              <CardDescription>
                Configure your Steam bot settings for automated trading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {botConfig && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-medium">Enable Steam Bot</h4>
                      <p className="text-sm text-muted-foreground">
                        Enable automated Steam trading bot
                      </p>
                    </div>
                    <Switch 
                      checked={botConfig.bot_enabled} 
                      onCheckedChange={(checked) => setBotConfig({...botConfig, bot_enabled: checked})} 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="steam_username">Steam Username</Label>
                      <Input
                        id="steam_username"
                        value={botConfig.steam_username}
                        onChange={(e) => setBotConfig({...botConfig, steam_username: e.target.value})}
                        placeholder="Bot Steam username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="steam_password">Steam Password</Label>
                      <Input
                        id="steam_password"
                        type="password"
                        value={botConfig.steam_password}
                        onChange={(e) => setBotConfig({...botConfig, steam_password: e.target.value})}
                        placeholder="Bot Steam password"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="steam_api_key">Steam API Key</Label>
                      <Input
                        id="steam_api_key"
                        value={botConfig.steam_api_key}
                        onChange={(e) => setBotConfig({...botConfig, steam_api_key: e.target.value})}
                        placeholder="Steam Web API key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="steam_id">Steam ID</Label>
                      <Input
                        id="steam_id"
                        value={botConfig.steam_id}
                        onChange={(e) => setBotConfig({...botConfig, steam_id: e.target.value})}
                        placeholder="Bot Steam ID"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="trade_offer_url">Trade Offer URL</Label>
                    <Input
                      id="trade_offer_url"
                      value={botConfig.trade_offer_url}
                      onChange={(e) => setBotConfig({...botConfig, trade_offer_url: e.target.value})}
                      placeholder="Bot trade offer URL"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="sync_interval">Sync Interval (seconds)</Label>
                      <Input
                        id="sync_interval"
                        type="number"
                        value={botConfig.inventory_sync_interval}
                        onChange={(e) => setBotConfig({...botConfig, inventory_sync_interval: parseInt(e.target.value)})}
                        placeholder="300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_trade_value">Max Trade Value ($)</Label>
                      <Input
                        id="max_trade_value"
                        type="number"
                        value={botConfig.max_trade_value}
                        onChange={(e) => setBotConfig({...botConfig, max_trade_value: parseInt(e.target.value)})}
                        placeholder="1000"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch 
                        id="auto_accept"
                        checked={botConfig.auto_accept_trades}
                        onCheckedChange={(checked) => setBotConfig({...botConfig, auto_accept_trades: checked})}
                      />
                      <Label htmlFor="auto_accept">Auto Accept Trades</Label>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button onClick={saveBotConfig} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bot Inventory Management</CardTitle>
                  <CardDescription>
                    Manage CS2 skins in the Steam bot inventory
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={syncInventory} disabled={syncing} variant="outline">
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync Inventory'}
                  </Button>
                  <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Item to Bot Inventory</DialogTitle>
                        <DialogDescription>
                          Add a new CS2 skin to the Steam bot inventory
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="item_name">Item Name</Label>
                            <Input
                              id="item_name"
                              value={newItem.name}
                              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                              placeholder="AK-47 | Redline"
                            />
                          </div>
                          <div>
                            <Label htmlFor="market_name">Market Name</Label>
                            <Input
                              id="market_name"
                              value={newItem.market_name}
                              onChange={(e) => setNewItem({...newItem, market_name: e.target.value})}
                              placeholder="AK-47 | Redline (Field-Tested)"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="category">Category</Label>
                            <Select value={newItem.category} onValueChange={(value) => setNewItem({...newItem, category: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="weapons">Weapons</SelectItem>
                                <SelectItem value="knives">Knives</SelectItem>
                                <SelectItem value="gloves">Gloves</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="rarity">Rarity</Label>
                            <Select value={newItem.rarity} onValueChange={(value) => setNewItem({...newItem, rarity: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Common">Common</SelectItem>
                                <SelectItem value="Uncommon">Uncommon</SelectItem>
                                <SelectItem value="Rare">Rare</SelectItem>
                                <SelectItem value="Legendary">Legendary</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="wear">Wear</Label>
                            <Select value={newItem.wear} onValueChange={(value) => setNewItem({...newItem, wear: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Factory New">Factory New</SelectItem>
                                <SelectItem value="Minimal Wear">Minimal Wear</SelectItem>
                                <SelectItem value="Field-Tested">Field-Tested</SelectItem>
                                <SelectItem value="Well-Worn">Well-Worn</SelectItem>
                                <SelectItem value="Battle-Scarred">Battle-Scarred</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="market_price">Market Price ($)</Label>
                            <Input
                              id="market_price"
                              type="number"
                              step="0.01"
                              value={newItem.market_price}
                              onChange={(e) => setNewItem({...newItem, market_price: parseFloat(e.target.value) || 0})}
                              placeholder="25.50"
                            />
                          </div>
                          <div>
                            <Label htmlFor="gem_price">Gem Price</Label>
                            <Input
                              id="gem_price"
                              type="number"
                              value={newItem.gem_price}
                              onChange={(e) => setNewItem({...newItem, gem_price: parseInt(e.target.value) || 0})}
                              placeholder="250"
                            />
                          </div>
                          <div>
                            <Label htmlFor="float_value">Float Value</Label>
                            <Input
                              id="float_value"
                              type="number"
                              step="0.001"
                              value={newItem.float_value}
                              onChange={(e) => setNewItem({...newItem, float_value: parseFloat(e.target.value) || 0})}
                              placeholder="0.150"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="image_url">Image URL</Label>
                          <Input
                            id="image_url"
                            value={newItem.image_url}
                            onChange={(e) => setNewItem({...newItem, image_url: e.target.value})}
                            placeholder="https://community.akamai.steamstatic.com/..."
                          />
                        </div>

                        <div>
                          <Label htmlFor="steam_asset_id">Steam Asset ID</Label>
                          <Input
                            id="steam_asset_id"
                            value={newItem.steam_asset_id}
                            onChange={(e) => setNewItem({...newItem, steam_asset_id: e.target.value})}
                            placeholder="Asset ID from Steam inventory"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={addInventoryItem}>
                            Add Item
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventory.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No Items in Inventory</h3>
                    <p className="text-muted-foreground mb-4">
                      Add CS2 skins to the bot inventory to start trading
                    </p>
                    <Button onClick={() => setShowAddItemDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Item
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inventory.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Badge variant={
                              item.rarity === 'Legendary' ? 'destructive' : 
                              item.rarity === 'Rare' ? 'default' : 'secondary'
                            }>
                              {item.rarity}
                            </Badge>
                            <Badge variant={
                              item.status === 'available' ? 'default' :
                              item.status === 'pending_trade' ? 'secondary' : 'destructive'
                            }>
                              {item.status}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <CardDescription>{item.market_name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Market Price:</span>
                            <span className="font-medium">${item.market_price}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Gem Price:</span>
                            <span className="font-medium">{item.gem_price} gems</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Wear:</span>
                            <span className="font-medium">{item.wear}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Float:</span>
                            <span className="font-medium">{item.float_value}</span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" className="flex-1">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trade Offers Tab */}
        <TabsContent value="trades" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trade Offers Management</CardTitle>
              <CardDescription>
                Monitor and manage Steam trade offers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tradeOffers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No Trade Offers</h3>
                    <p className="text-muted-foreground">
                      Trade offers will appear here when users purchase skins
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 border-r">User</th>
                          <th className="text-left p-3 border-r">Item</th>
                          <th className="text-left p-3 border-r">Gems Paid</th>
                          <th className="text-left p-3 border-r">Status</th>
                          <th className="text-left p-3 border-r">Created</th>
                          <th className="text-left p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradeOffers.map((offer) => (
                          <tr key={offer.id} className="border-b hover:bg-muted/50">
                            <td className="p-3 border-r">
                              <div>
                                <div className="font-medium">{offer.users?.username}</div>
                                <div className="text-sm text-muted-foreground">{offer.users?.email}</div>
                              </div>
                            </td>
                            <td className="p-3 border-r">
                              <div>
                                <div className="font-medium">{offer.steam_bot_inventory?.name}</div>
                                <div className="text-sm text-muted-foreground">{offer.steam_bot_inventory?.market_name}</div>
                              </div>
                            </td>
                            <td className="p-3 border-r">
                              <span className="font-medium">{offer.gems_paid} gems</span>
                            </td>
                            <td className="p-3 border-r">
                              <Badge variant={
                                offer.status === 'completed' ? 'default' :
                                offer.status === 'sent' ? 'secondary' :
                                offer.status === 'pending' ? 'outline' : 'destructive'
                              }>
                                {offer.status}
                              </Badge>
                            </td>
                            <td className="p-3 border-r">
                              {new Date(offer.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                {offer.status === 'sent' && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => markTradeCompleted(offer.id, offer.item_id)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Complete
                                  </Button>
                                )}
                                {offer.steam_offer_id && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={`https://steamcommunity.com/tradeoffer/${offer.steam_offer_id}`} target="_blank">
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      View
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bot Monitoring</CardTitle>
              <CardDescription>
                Monitor Steam bot health and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Bot Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant={botConfig?.status === 'online' ? 'default' : 'destructive'}>
                          {botConfig?.status || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Sync:</span>
                        <span className="text-sm text-muted-foreground">
                          {botConfig?.last_sync ? new Date(botConfig.last_sync).toLocaleString() : 'Never'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Auto Accept:</span>
                        <Badge variant={botConfig?.auto_accept_trades ? 'default' : 'secondary'}>
                          {botConfig?.auto_accept_trades ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Successful Trades:</span>
                        <span className="font-medium">
                          {tradeOffers.filter(t => t.status === 'completed').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending Trades:</span>
                        <span className="font-medium">
                          {tradeOffers.filter(t => t.status === 'pending' || t.status === 'sent').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Failed Trades:</span>
                        <span className="font-medium">
                          {tradeOffers.filter(t => t.status === 'failed' || t.status === 'cancelled').length}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">System Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {!botConfig?.bot_enabled && (
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          <div>
                            <div className="font-medium">Steam Bot Disabled</div>
                            <div className="text-sm text-muted-foreground">
                              Enable the Steam bot to start processing trade offers
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {botConfig?.status === 'offline' && (
                        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          <div>
                            <div className="font-medium">Bot Offline</div>
                            <div className="text-sm text-muted-foreground">
                              Steam bot is offline. Check configuration and restart
                            </div>
                          </div>
                        </div>
                      )}

                      {inventoryStats.available_items === 0 && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-blue-500" />
                          <div>
                            <div className="font-medium">Empty Inventory</div>
                            <div className="text-sm text-muted-foreground">
                              Add items to the bot inventory to enable trading
                            </div>
                          </div>
                        </div>
                      )}

                      {botConfig?.bot_enabled && botConfig?.status === 'online' && inventoryStats.available_items > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <div className="font-medium">All Systems Operational</div>
                            <div className="text-sm text-muted-foreground">
                              Steam bot is running normally and ready to process trades
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}