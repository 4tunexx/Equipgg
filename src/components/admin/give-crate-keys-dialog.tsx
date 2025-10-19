'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { useToast } from "../../hooks/use-toast";
import { Gift } from 'lucide-react';

interface GiveCrateKeysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
}

const CRATES = [
  { id: 1, name: 'Level Up Crate', icon: '📦' },
  { id: 2, name: 'Weekly Loyalty Crate', icon: '🎁' },
  { id: 3, name: 'Prestige Crate', icon: '👑' },
  { id: 4, name: 'Reward Crate', icon: '🏆' },
  { id: 5, name: 'Event Crate', icon: '🎊' }
];

export function GiveCrateKeysDialog({ open, onOpenChange, userId, username }: GiveCrateKeysDialogProps) {
  const { toast } = useToast();
  const [selectedCrate, setSelectedCrate] = useState(1);
  const [keysCount, setKeysCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleGiveKeys = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/give-crate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          crateId: selectedCrate,
          keysCount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to give keys');
      }

      toast({
        title: "Keys Given Successfully",
        description: `${keysCount} key(s) for ${CRATES.find(c => c.id === selectedCrate)?.name} given to ${username}`
      });

      onOpenChange(false);
      setKeysCount(1);
    } catch (error) {
      console.error('Error giving keys:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to give keys"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Give Crate Keys</DialogTitle>
          <DialogDescription>
            Award crate keys to {username}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="crate">Select Crate</Label>
            <Select value={selectedCrate.toString()} onValueChange={(val) => setSelectedCrate(parseInt(val))}>
              <SelectTrigger id="crate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CRATES.map((crate) => (
                  <SelectItem key={crate.id} value={crate.id.toString()}>
                    {crate.icon} {crate.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keys">Number of Keys</Label>
            <Input
              id="keys"
              type="number"
              min="1"
              max="100"
              value={keysCount}
              onChange={(e) => setKeysCount(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <p className="font-semibold mb-1">📋 Summary:</p>
            <p>User: <span className="font-medium">{username}</span></p>
            <p>Crate: <span className="font-medium">{CRATES.find(c => c.id === selectedCrate)?.name}</span></p>
            <p>Keys: <span className="font-medium">{keysCount}</span></p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleGiveKeys} disabled={isLoading}>
            <Gift className="w-4 h-4 mr-2" />
            {isLoading ? 'Giving...' : 'Give Keys'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
