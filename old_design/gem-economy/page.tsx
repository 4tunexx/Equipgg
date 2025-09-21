'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gem, Coins, CreditCard, Gamepad2, ArrowRightLeft, TrendingUp, Shield, Zap, Crown } from 'lucide-react';
import Link from 'next/link';
import { useBalance } from '@/contexts/balance-context';

interface UserBalance {
  coins: number;
  gems: number;
  xp: number;
  level: number;
}

interface EconomyStats {
  totalGemsInCirculation: number;
  totalCoinsInCirculation: number;
  gemExchangeRate: number;
  coinExchangeRate: number;
  dailyGemLimit: number;
  dailyCoinLimit: number;
  levelMultiplier: number;
}

export default function GemEconomyPage() {
  const { balance: userBalance } = useBalance();
  const [economyStats, setEconomyStats] = useState<EconomyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Only fetch economy stats, balance is handled by context
      const limitsResponse = await fetch('/api/economy/balance-limits');

      if (limitsResponse.ok) {
        const limitsData = await limitsResponse.json();
        setEconomyStats(limitsData.limits);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading economy data...</p>
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
            <TrendingUp className="h-8 w-8 text-green-400" />
            Gem Economy Overview
          </h1>
          <p className="text-muted-foreground">Understanding the gem economy and your limits</p>
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

      {/* Economy Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exchange Rate</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1000:1</div>
            <p className="text-xs text-muted-foreground">
              Coins to Gems
            </p>
            <div className="mt-2">
              <div className="text-sm font-medium">1 Gem = 800 Coins</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Limits</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{economyStats?.dailyGemLimit || 0}</div>
            <p className="text-xs text-muted-foreground">
              Gems per day
            </p>
            <div className="mt-2">
              <div className="text-sm font-medium">{economyStats?.dailyCoinLimit || 0} Coins/day</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level Multiplier</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{economyStats?.levelMultiplier || 1}x</div>
            <p className="text-xs text-muted-foreground">
              Level {userBalance?.level || 1} bonus
            </p>
            <div className="mt-2">
              <div className="text-sm font-medium">Higher level = more limits</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Level</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userBalance?.level || 1}</div>
            <p className="text-xs text-muted-foreground">
              {userBalance?.xp || 0} XP
            </p>
            <div className="mt-2">
              <XpDisplay 
                xp={userBalance?.xp || 0} 
                level={userBalance?.level || 1}
                userId={user?.id}
                autoFetch={true}
                showText={false}
                progressClassName="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Economy Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gem className="h-5 w-5 text-yellow-400" />
              Gem Features
            </CardTitle>
            <CardDescription>
              What you can do with gems
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Gamepad2 className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="font-medium">CS2 Skin Purchases</p>
                  <p className="text-sm text-muted-foreground">Buy real CS2 skins with gems</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-400" />
                <div>
                  <p className="font-medium">Real Money Purchase</p>
                  <p className="text-sm text-muted-foreground">Buy gems with real money</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <ArrowRightLeft className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="font-medium">Currency Exchange</p>
                  <p className="text-sm text-muted-foreground">Convert coins to gems and vice versa</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              Anti-Inflation System
            </CardTitle>
            <CardDescription>
              How we prevent economy inflation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <div>
                  <p className="font-medium">Daily Limits</p>
                  <p className="text-sm text-muted-foreground">Maximum gems/coins earned per day</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Crown className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="font-medium">Level-Based Multipliers</p>
                  <p className="text-sm text-muted-foreground">Higher level = higher limits</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Zap className="h-5 w-5 text-red-400" />
                <div>
                  <p className="font-medium">Exchange Rate Control</p>
                  <p className="text-sm text-muted-foreground">Controlled conversion rates</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Access gem economy features quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/gems">
              <Button className="w-full flex items-center gap-2" variant="outline">
                <ArrowRightLeft className="h-4 w-4" />
                Exchange Currency
              </Button>
            </Link>
            <Link href="/dashboard/gems">
              <Button className="w-full flex items-center gap-2" variant="outline">
                <CreditCard className="h-4 w-4" />
                Buy Gems
              </Button>
            </Link>
            <Link href="/dashboard/cs2-skins">
              <Button className="w-full flex items-center gap-2" variant="outline">
                <Gamepad2 className="h-4 w-4" />
                CS2 Skins
              </Button>
            </Link>
            <Link href="/dashboard/gem-history">
              <Button className="w-full flex items-center gap-2" variant="outline">
                <TrendingUp className="h-4 w-4" />
                Transaction History
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Economy Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Economy Tips</CardTitle>
          <CardDescription>
            Tips to maximize your gem economy experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-green-400">Earning Gems</h4>
              <ul className="space-y-2 text-sm">
                <li>• Complete daily missions for XP and coins</li>
                <li>• Play arcade games and betting for rewards</li>
                <li>• Exchange coins for gems (1000 coins = 1 gem)</li>
                <li>• Purchase gems with real money for instant access</li>
                <li>• Level up to increase daily earning limits</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-blue-400">Using Gems</h4>
              <ul className="space-y-2 text-sm">
                <li>• Buy exclusive CS2 skins with gems</li>
                <li>• Exchange gems back to coins when needed</li>
                <li>• Save gems for high-value items</li>
                <li>• Check daily limits before large exchanges</li>
                <li>• Monitor your transaction history</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
