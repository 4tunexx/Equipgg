'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Settings } from 'lucide-react';
import { useBalance } from '@/contexts/balance-context';

interface AdminBalanceManagerProps {
  userCoins: number;
  userGems: number;
  onBalanceUpdate: (coins: number, gems: number) => void;
}

export function AdminBalanceManager({ userCoins, userGems, onBalanceUpdate }: AdminBalanceManagerProps) {
  const { updateBalance } = useBalance();
  const [coins, setCoins] = useState(userCoins);
  const [gems, setGems] = useState(userGems);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCoins(userCoins);
    setGems(userGems);
  }, [userCoins, userGems]);

  const handleUpdateBalance = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coins, gems })
      });

      if (response.ok) {
        const data = await response.json();
        // Update global balance context
        updateBalance({ coins: data.coins, gems: data.gems });
        // Dispatch balance update event
        window.dispatchEvent(new CustomEvent('balanceUpdated', {
          detail: { coins: data.coins, gems: data.gems }
        }));
        // Keep the callback for backward compatibility
        onBalanceUpdate(data.coins, data.gems);
        toast({
          title: "Balance Updated",
          description: `Coins: ${data.coins}, Gems: ${data.gems}`,
        });
        setIsOpen(false);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update balance",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update balance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-2">
      {/* Advanced Settings Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" className="w-full h-7 text-xs">
            <Settings className="h-3 w-3 mr-1" />
            Manage Balance
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Admin Balance</DialogTitle>
            <DialogDescription>
              Set your exact coin and gem amounts for testing purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gems">Gems</Label>
              <Input
                id="gems"
                type="number"
                value={gems}
                onChange={(e) => setGems(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coins">Coins</Label>
              <Input
                id="coins"
                type="number"
                value={coins}
                onChange={(e) => setCoins(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpdateBalance}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Updating..." : "Update Balance"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
