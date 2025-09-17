'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gem, Settings, CreditCard, Gamepad2, ArrowRightLeft, Plus, Edit, Trash2, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GemSettings {
  gemShopEnabled: boolean;
  cs2SkinsEnabled: boolean;
  exchangeEnabled: boolean;
  dailyExchangeLimit: number;
  maxExchangePerTransaction: number;
  gemShopMaintenance: boolean;
}

interface ExchangeRates {
  coinsToGems: number;
  gemsToCoins: number;
}

interface GemPackage {
  id: string;
  gems: number;
  price: number;
  currency: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface CS2Skin {
  id: string;
  name: string;
  rarity: string;
  gems: number;
  steamMarketPrice: number;
  category: string;
  enabled: boolean;
}

interface PaymentSettings {
  stripePublicKey: string;
  stripeSecretKey: string;
  paypalClientId: string;
  paypalClientSecret: string;
  webhookSecret: string;
  enabled: boolean;
}

interface GemStats {
  totalTransactions: number;
  totalGemsPurchased: number;
  totalRevenue: number;
  totalSkinPurchases: number;
}

export default function GemManagementPage() {
  const [gemSettings, setGemSettings] = useState<GemSettings>({
    gemShopEnabled: true,
    cs2SkinsEnabled: true,
    exchangeEnabled: true,
    dailyExchangeLimit: 10000,
    maxExchangePerTransaction: 1000,
    gemShopMaintenance: false
  });
  
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    coinsToGems: 1000,
    gemsToCoins: 800
  });
  
  const [gemPackages, setGemPackages] = useState<GemPackage[]>([]);
  const [cs2Skins, setCS2Skins] = useState<CS2Skin[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    stripePublicKey: '',
    stripeSecretKey: '',
    paypalClientId: '',
    paypalClientSecret: '',
    webhookSecret: '',
    enabled: false
  });
  
  const [gemStats, setGemStats] = useState<GemStats>({
    totalTransactions: 0,
    totalGemsPurchased: 0,
    totalRevenue: 0,
    totalSkinPurchases: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPackage, setEditingPackage] = useState<GemPackage | null>(null);
  const [editingSkin, setEditingSkin] = useState<CS2Skin | null>(null);
  const [newPackage, setNewPackage] = useState<Partial<GemPackage>>({});
  const [newSkin, setNewSkin] = useState<Partial<CS2Skin>>({});
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/admin/gem-management');
      const data = await response.json();
      
      if (response.ok) {
        setGemSettings(data.data.gemSettings);
        setExchangeRates(data.data.exchangeRates);
        setGemPackages(data.data.gemPackages || []);
        setCS2Skins(data.data.cs2Skins || []);
        setPaymentSettings(data.data.paymentSettings);
        setGemStats(data.data.gemStats || {});
      }
    } catch (error) {
      console.error('Failed to load gem management data:', error);
      toast({
        title: "Error",
        description: "Failed to load gem management data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (action: string, data: any) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/gem-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
      });

      const result = await response.json();
      if (response.ok) {
        toast({
          title: "Success",
          description: result.message
        });
        loadData(); // Reload data
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGemSettingsChange = (key: keyof GemSettings, value: any) => {
    setGemSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleExchangeRatesChange = (key: keyof ExchangeRates, value: number) => {
    setExchangeRates(prev => ({ ...prev, [key]: value }));
  };

  const handlePaymentSettingsChange = (key: keyof PaymentSettings, value: any) => {
    setPaymentSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading gem management...</p>
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
            <Gem className="h-8 w-8 text-yellow-400" />
            Gem Management
          </h1>
          <p className="text-muted-foreground">Manage gem economy, exchange rates, and payment settings</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Gem className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gemStats.totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gems Purchased</CardTitle>
            <Gem className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gemStats.totalGemsPurchased?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${gemStats.totalRevenue?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CS2 Skin Sales</CardTitle>
            <Gamepad2 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gemStats.totalSkinPurchases || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="exchange" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Exchange
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Gem className="h-4 w-4" />
            Packages
          </TabsTrigger>
          <TabsTrigger value="skins" className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            CS2 Skins
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        {/* Gem Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gem Shop Settings</CardTitle>
              <CardDescription>Control gem shop functionality and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="gemShopEnabled">Gem Shop Enabled</Label>
                    <Switch
                      id="gemShopEnabled"
                      checked={gemSettings.gemShopEnabled}
                      onCheckedChange={(checked) => handleGemSettingsChange('gemShopEnabled', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cs2SkinsEnabled">CS2 Skins Enabled</Label>
                    <Switch
                      id="cs2SkinsEnabled"
                      checked={gemSettings.cs2SkinsEnabled}
                      onCheckedChange={(checked) => handleGemSettingsChange('cs2SkinsEnabled', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="exchangeEnabled">Exchange Enabled</Label>
                    <Switch
                      id="exchangeEnabled"
                      checked={gemSettings.exchangeEnabled}
                      onCheckedChange={(checked) => handleGemSettingsChange('exchangeEnabled', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="gemShopMaintenance">Maintenance Mode</Label>
                    <Switch
                      id="gemShopMaintenance"
                      checked={gemSettings.gemShopMaintenance}
                      onCheckedChange={(checked) => handleGemSettingsChange('gemShopMaintenance', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dailyExchangeLimit">Daily Exchange Limit</Label>
                    <Input
                      id="dailyExchangeLimit"
                      type="number"
                      value={gemSettings.dailyExchangeLimit}
                      onChange={(e) => handleGemSettingsChange('dailyExchangeLimit', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxExchangePerTransaction">Max Exchange Per Transaction</Label>
                    <Input
                      id="maxExchangePerTransaction"
                      type="number"
                      value={gemSettings.maxExchangePerTransaction}
                      onChange={(e) => handleGemSettingsChange('maxExchangePerTransaction', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => saveSettings('updateGemSettings', gemSettings)}
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exchange Rates Tab */}
        <TabsContent value="exchange" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exchange Rates</CardTitle>
              <CardDescription>Set the exchange rates between coins and gems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="coinsToGems">Coins to Gems Rate</Label>
                  <Input
                    id="coinsToGems"
                    type="number"
                    value={exchangeRates.coinsToGems}
                    onChange={(e) => handleExchangeRatesChange('coinsToGems', parseInt(e.target.value))}
                    placeholder="1000"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    How many coins equal 1 gem
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="gemsToCoins">Gems to Coins Rate</Label>
                  <Input
                    id="gemsToCoins"
                    type="number"
                    value={exchangeRates.gemsToCoins}
                    onChange={(e) => handleExchangeRatesChange('gemsToCoins', parseInt(e.target.value))}
                    placeholder="800"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    How many coins you get for 1 gem
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={() => saveSettings('updateExchangeRates', exchangeRates)}
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Saving...' : 'Save Exchange Rates'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gem Packages Tab */}
        <TabsContent value="packages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gem Packages</CardTitle>
              <CardDescription>Manage gem packages for purchase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Current Packages</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Package
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Gem Package</DialogTitle>
                      <DialogDescription>Create a new gem package for purchase</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="packageId">Package ID</Label>
                        <Input
                          id="packageId"
                          value={newPackage.id || ''}
                          onChange={(e) => setNewPackage(prev => ({ ...prev, id: e.target.value }))}
                          placeholder="starter"
                        />
                      </div>
                      <div>
                        <Label htmlFor="packageGems">Gems</Label>
                        <Input
                          id="packageGems"
                          type="number"
                          value={newPackage.gems || ''}
                          onChange={(e) => setNewPackage(prev => ({ ...prev, gems: parseInt(e.target.value) }))}
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="packagePrice">Price ($)</Label>
                        <Input
                          id="packagePrice"
                          type="number"
                          step="0.01"
                          value={newPackage.price || ''}
                          onChange={(e) => setNewPackage(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                          placeholder="4.99"
                        />
                      </div>
                      <div>
                        <Label htmlFor="packageName">Name</Label>
                        <Input
                          id="packageName"
                          value={newPackage.name || ''}
                          onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Starter Package"
                        />
                      </div>
                      <div>
                        <Label htmlFor="packageDescription">Description</Label>
                        <Input
                          id="packageDescription"
                          value={newPackage.description || ''}
                          onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Perfect for beginners"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={() => {
                          saveSettings('addGemPackage', newPackage);
                          setNewPackage({});
                        }}
                        disabled={saving}
                      >
                        Add Package
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Gems</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gemPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell>{pkg.gems.toLocaleString()}</TableCell>
                      <TableCell>${pkg.price}</TableCell>
                      <TableCell>
                        <Badge variant={pkg.enabled ? "default" : "secondary"}>
                          {pkg.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => saveSettings('deleteGemPackage', { id: pkg.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CS2 Skins Tab */}
        <TabsContent value="skins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CS2 Skins</CardTitle>
              <CardDescription>Manage CS2 skins available for purchase with gems</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Available Skins</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Skin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New CS2 Skin</DialogTitle>
                      <DialogDescription>Add a new CS2 skin to the marketplace</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="skinId">Skin ID</Label>
                        <Input
                          id="skinId"
                          value={newSkin.id || ''}
                          onChange={(e) => setNewSkin(prev => ({ ...prev, id: e.target.value }))}
                          placeholder="ak47_vulcan"
                        />
                      </div>
                      <div>
                        <Label htmlFor="skinName">Skin Name</Label>
                        <Input
                          id="skinName"
                          value={newSkin.name || ''}
                          onChange={(e) => setNewSkin(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="AK-47 | Vulcan"
                        />
                      </div>
                      <div>
                        <Label htmlFor="skinRarity">Rarity</Label>
                        <Input
                          id="skinRarity"
                          value={newSkin.rarity || ''}
                          onChange={(e) => setNewSkin(prev => ({ ...prev, rarity: e.target.value }))}
                          placeholder="Rare"
                        />
                      </div>
                      <div>
                        <Label htmlFor="skinGems">Gems Cost</Label>
                        <Input
                          id="skinGems"
                          type="number"
                          value={newSkin.gems || ''}
                          onChange={(e) => setNewSkin(prev => ({ ...prev, gems: parseInt(e.target.value) }))}
                          placeholder="800"
                        />
                      </div>
                      <div>
                        <Label htmlFor="skinPrice">Steam Market Price ($)</Label>
                        <Input
                          id="skinPrice"
                          type="number"
                          step="0.01"
                          value={newSkin.steamMarketPrice || ''}
                          onChange={(e) => setNewSkin(prev => ({ ...prev, steamMarketPrice: parseFloat(e.target.value) }))}
                          placeholder="25.50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="skinCategory">Category</Label>
                        <Input
                          id="skinCategory"
                          value={newSkin.category || ''}
                          onChange={(e) => setNewSkin(prev => ({ ...prev, category: e.target.value }))}
                          placeholder="weapons"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={() => {
                          saveSettings('addCS2Skin', newSkin);
                          setNewSkin({});
                        }}
                        disabled={saving}
                      >
                        Add Skin
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Rarity</TableHead>
                    <TableHead>Gems</TableHead>
                    <TableHead>Steam Price</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cs2Skins.map((skin) => (
                    <TableRow key={skin.id}>
                      <TableCell className="font-medium">{skin.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{skin.rarity}</Badge>
                      </TableCell>
                      <TableCell>{skin.gems.toLocaleString()}</TableCell>
                      <TableCell>${skin.steamMarketPrice}</TableCell>
                      <TableCell>{skin.category}</TableCell>
                      <TableCell>
                        <Badge variant={skin.enabled ? "default" : "secondary"}>
                          {skin.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => saveSettings('deleteCS2Skin', { id: skin.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure payment gateways for real money transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="paymentEnabled">Payment System Enabled</Label>
                <Switch
                  id="paymentEnabled"
                  checked={paymentSettings.enabled}
                  onCheckedChange={(checked) => handlePaymentSettingsChange('enabled', checked)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Stripe Settings</h4>
                  <div>
                    <Label htmlFor="stripePublicKey">Stripe Public Key</Label>
                    <Input
                      id="stripePublicKey"
                      type="password"
                      value={paymentSettings.stripePublicKey}
                      onChange={(e) => handlePaymentSettingsChange('stripePublicKey', e.target.value)}
                      placeholder="pk_test_..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                    <Input
                      id="stripeSecretKey"
                      type="password"
                      value={paymentSettings.stripeSecretKey}
                      onChange={(e) => handlePaymentSettingsChange('stripeSecretKey', e.target.value)}
                      placeholder="sk_test_..."
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">PayPal Settings</h4>
                  <div>
                    <Label htmlFor="paypalClientId">PayPal Client ID</Label>
                    <Input
                      id="paypalClientId"
                      type="password"
                      value={paymentSettings.paypalClientId}
                      onChange={(e) => handlePaymentSettingsChange('paypalClientId', e.target.value)}
                      placeholder="AeA1QIZXiflr1..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="paypalClientSecret">PayPal Client Secret</Label>
                    <Input
                      id="paypalClientSecret"
                      type="password"
                      value={paymentSettings.paypalClientSecret}
                      onChange={(e) => handlePaymentSettingsChange('paypalClientSecret', e.target.value)}
                      placeholder="EC0br..."
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="webhookSecret">Webhook Secret</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  value={paymentSettings.webhookSecret}
                  onChange={(e) => handlePaymentSettingsChange('webhookSecret', e.target.value)}
                  placeholder="whsec_..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Secret for verifying webhook signatures
                </p>
              </div>
              
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Security Notice</h4>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  These settings contain sensitive payment information. Make sure to use test keys during development 
                  and production keys only in production environment. Never commit these keys to version control.
                </p>
              </div>
              
              <Button 
                onClick={() => saveSettings('updatePaymentSettings', paymentSettings)}
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Saving...' : 'Save Payment Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
