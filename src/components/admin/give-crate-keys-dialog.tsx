'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { useToast } from "../../hooks/use-toast";
import { Gift } from 'lucide-react';
import { supabase } from "../../lib/supabase/client";

interface GiveCrateKeysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
}

interface Crate {
  id: number;
  name: string;
  is_active: boolean;
}

export function GiveCrateKeysDialog({ open, onOpenChange, userId, username }: GiveCrateKeysDialogProps) {
  const { toast } = useToast();
  const [crates, setCrates] = useState<Crate[]>([]);
  const [selectedCrate, setSelectedCrate] = useState<number | null>(null);
  const [keysCount, setKeysCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCrates, setLoadingCrates] = useState(true);

  // Fetch crates from database when dialog opens
  useEffect(() => {
    if (open) {
      fetchCrates();
    }
  }, [open]);

  const fetchCrates = async () => {
    try {
      setLoadingCrates(true);
      const { data, error } = await supabase
        .from('crates')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('id');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCrates(data);
        setSelectedCrate(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching crates:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load crates"
      });
    } finally {
      setLoadingCrates(false);
    }
  };

  const handleGiveKeys = async () => {
    if (!selectedCrate || keysCount < 1) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a crate and enter a valid number of keys"
      });
      return;
    }

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
        throw new Error(data.error || data.details || 'Failed to give keys');
      }

      const crateName = crates.find(c => c.id === selectedCrate)?.name || 'Unknown Crate';
      toast({
        title: "Keys Given Successfully",
        description: `${keysCount} key(s) for ${crateName} given to ${username}`
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
            {loadingCrates ? (
              <div className="text-sm text-muted-foreground">Loading crates...</div>
            ) : crates.length === 0 ? (
              <div className="text-sm text-destructive">No active crates available</div>
            ) : (
              <Select 
                value={selectedCrate?.toString() || ''} 
                onValueChange={(val) => setSelectedCrate(parseInt(val))}
              >
                <SelectTrigger id="crate">
                  <SelectValue placeholder="Select a crate" />
                </SelectTrigger>
                <SelectContent>
                  {crates.map((crate) => (
                    <SelectItem key={crate.id} value={crate.id.toString()}>
                      {crate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
            <p>Crate: <span className="font-medium">{crates.find(c => c.id === selectedCrate)?.name || 'Not selected'}</span></p>
            <p>Keys: <span className="font-medium">{keysCount}</span></p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleGiveKeys} disabled={isLoading || !selectedCrate || keysCount < 1 || loadingCrates}>
            <Gift className="w-4 h-4 mr-2" />
            {isLoading ? 'Giving...' : 'Give Keys'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
