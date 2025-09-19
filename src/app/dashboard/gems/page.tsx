'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";
import { Gem, Coins, ArrowRightLeft, CreditCard, Gamepad2, History } from 'lucide-react';
import { useToast } from "../../../hooks/use-toast";
import { useBalance } from "../../../contexts/balance-context";

interface UserBalance {
  coins: number;
  gems: number;
  xp: number;
  level: number;
}

interface ExchangeRates {
  coinsToGems: number;
  gemsToCoins: number;
}

interface GemPackages {
  starter: { gems: number; price: number; currency: string };
  popular: { gems: number; price: number; currency: string };
  value: { gems: number; price: number; currency: string };
  premium: { gems: number; price: number; currency: string };
  ultimate: { gems: number; price: number; currency: string };
}

export default function GemsPage() {
  const { balance: userBalance } = useBalance();
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [gemPackages, setGemPackages] = useState<GemPackages | null>(null);
  const [loading, setLoading] = useState(true);
  const [exchanging, setExchanging] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  
  // Exchange form state
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [exchangeFrom, setExchangeFrom] = useState<'coins' | 'gems'>('coins');
  const [exchangeTo, setExchangeTo] = useState<'coins' | 'gems'>('gems');
  
  // Purchase form state
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [steamId, setSteamId] = useState('');
  const [steamTradeUrl, setSteamTradeUrl] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Only fetch packages data, balance is handled by context
      const packagesResponse = await fetch('/api/economy/purchase-gems');

      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json();
        setExchangeRates(packagesData.exchangeRates);
        setGemPackages(packagesData.packages);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load gem data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExchange = async () => {
    if (!exchangeAmount || !userBalance) return;

    const amount = parseInt(exchangeAmount);
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    setExchanging(true);
    try {
      const response = await fetch('/api/economy/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCurrency: exchangeFrom,
          toCurrency: exchangeTo,
          amount
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Exchange Successful!",
          description: data.message
        });
        // Balance updates handled by context
        window.dispatchEvent(new CustomEvent('balanceUpdated', {
          detail: { coins: data.newBalance.coins, gems: data.newBalance.gems }
        }));
        setExchangeAmount('');
      } else {
        toast({
          title: "Exchange Failed",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process exchange",
        variant: "destructive"
      });
    } finally {
      setExchanging(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !steamId || !steamTradeUrl) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setPurchasing(true);
    try {
      const response = await fetch('/api/economy/purchase-gems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage,
          paymentMethod: 'credit_card',
          steamId,
          steamTradeUrl
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Purchase Successful!",
          description: data.message
        });
        // Balance updates handled by context
        window.dispatchEvent(new CustomEvent('balanceUpdated', {
          detail: { gems: data.newBalance.gems }
        }));
        setSelectedPackage('');
        setSteamId('');
        setSteamTradeUrl('');
      } else {
        toast({
          title: "Purchase Failed",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process purchase",
        variant: "destructive"
      });
    } finally {
      setPurchasing(false);
    }
  };

  const calculateExchangeAmount = () => {
    if (!exchangeAmount || !exchangeRates) return 0;
    const amount = parseInt(exchangeAmount);
    if (exchangeFrom === 'coins' && exchangeTo === 'gems') {
      return Math.floor(amount / exchangeRates.coinsToGems);
    } else if (exchangeFrom === 'gems' && exchangeTo === 'coins') {
      return amount * exchangeRates.gemsToCoins;
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading gem data...</p>
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
            Gem Economy
          </h1>
          <p className="text-muted-foreground">Manage your gems and exchange currencies</p>
        </div>
        
        {/* Balance Display */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg">
            <Coins className="h-5 w-5 text-green-400" />
            <span className="font-bold">{userBalance?.coins?.toLocaleString() || 0}</span>
            <span className="text-muted-foreground">Coins</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg">
            <Gem className="h-5 w-5 text-yellow-400" />
            <span className="font-bold">{userBalance?.gems?.toLocaleString() || 0}</span>
            <span className="text-muted-foreground">Gems</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="exchange" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="exchange" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Exchange
          </TabsTrigger>
          <TabsTrigger value="purchase" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Buy Gems
          </TabsTrigger>
          <TabsTrigger value="skins" className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            CS2 Skins
          </TabsTrigger>
        </TabsList>

        {/* Exchange Tab */}
        <TabsContent value="exchange" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Currency Exchange</CardTitle>
              <CardDescription>
                Convert between coins and gems. Exchange rates: 1000 coins = 1 gem, 1 gem = 800 coins
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* From Currency */}
                <div className="space-y-4">
                  <Label>From</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={exchangeFrom === 'coins' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setExchangeFrom('coins');
                          setExchangeTo('gems');
                        }}
                        className="flex items-center gap-2"
                      >
                        <Coins className="h-4 w-4" />
                        Coins
                      </Button>
                      <Button
                        variant={exchangeFrom === 'gems' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setExchangeFrom('gems');
                          setExchangeTo('coins');
                        }}
                        className="flex items-center gap-2"
                      >
                        <Gem className="h-4 w-4" />
                        Gems
                      </Button>
                    </div>
                    <Input
                      type="number"
                      placeholder={`Enter ${exchangeFrom} amount`}
                      value={exchangeAmount}
                      onChange={(e) => setExchangeAmount(e.target.value)}
                      max={exchangeFrom === 'coins' ? userBalance?.coins : userBalance?.gems}
                    />
                    <p className="text-sm text-muted-foreground">
                      Available: {exchangeFrom === 'coins' ? userBalance?.coins?.toLocaleString() : userBalance?.gems?.toLocaleString()} {exchangeFrom}
                    </p>
                  </div>
                </div>

                {/* To Currency */}
                <div className="space-y-4">
                  <Label>To</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={exchangeTo === 'gems' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setExchangeTo('gems');
                          setExchangeFrom('coins');
                        }}
                        className="flex items-center gap-2"
                      >
                        <Gem className="h-4 w-4" />
                        Gems
                      </Button>
                      <Button
                        variant={exchangeTo === 'coins' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setExchangeTo('coins');
                          setExchangeFrom('gems');
                        }}
                        className="flex items-center gap-2"
                      >
                        <Coins className="h-4 w-4" />
                        Coins
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-lg font-bold">
                        {calculateExchangeAmount().toLocaleString()} {exchangeTo}
                      </p>
                      <p className="text-sm text-muted-foreground">You will receive</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleExchange} 
                disabled={exchanging || !exchangeAmount}
                className="w-full"
              >
                {exchanging ? 'Exchanging...' : `Exchange ${exchangeAmount} ${exchangeFrom} for ${calculateExchangeAmount()} ${exchangeTo}`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Tab */}
        <TabsContent value="purchase" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buy Gems with Real Money</CardTitle>
              <CardDescription>
                Purchase gems with real money to buy exclusive items and CS2 skins
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Gem Packages */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gemPackages && Object.entries(gemPackages).map(([packageId, pkg]) => (
                  <Card 
                    key={packageId}
                    className={`cursor-pointer transition-all ${
                      selectedPackage === packageId ? 'ring-2 ring-primary' : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedPackage(packageId)}
                  >
                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl">{pkg.gems.toLocaleString()}</CardTitle>
                      <CardDescription>Gems</CardDescription>
                      <div className="text-3xl font-bold text-primary">${pkg.price}</div>
                      <Badge variant="secondary" className="w-fit mx-auto">
                        {packageId.charAt(0).toUpperCase() + packageId.slice(1)} Package
                      </Badge>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {/* Steam Information */}
              <div className="space-y-4">
                <Label>Steam Information (for CS2 skin delivery)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="steamId">Steam ID</Label>
                    <Input
                      id="steamId"
                      placeholder="Enter your Steam ID"
                      value={steamId}
                      onChange={(e) => setSteamId(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="steamTradeUrl">Steam Trade URL</Label>
                    <Input
                      id="steamTradeUrl"
                      placeholder="Enter your Steam Trade URL"
                      value={steamTradeUrl}
                      onChange={(e) => setSteamTradeUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handlePurchase} 
                disabled={purchasing || !selectedPackage}
                className="w-full"
              >
                {purchasing ? 'Processing...' : `Purchase ${selectedPackage ? gemPackages?.[selectedPackage as keyof GemPackages]?.gems : 0} Gems`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CS2 Skins Tab */}
        <TabsContent value="skins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CS2 Skin Marketplace</CardTitle>
              <CardDescription>
                Buy real CS2 skins with gems. Skins will be delivered to your Steam inventory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">CS2 Skin Shop Coming Soon!</h3>
                <p className="text-muted-foreground">
                  The CS2 skin marketplace is being prepared. You'll be able to buy real skins with gems soon!
                </p>
                <Button className="mt-4" disabled>
                  Browse Skins (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
