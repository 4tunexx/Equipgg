'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { useToast } from "../../../../hooks/use-toast";
import { useAuth } from "../../../../hooks/use-auth";
import { createSupabaseQueries, DBCrate, DBItem } from "../../../../lib/supabase/queries";
import { supabase } from "../../../../lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Trash2, Edit, Plus, Package, Gift } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Switch } from "../../../../components/ui/switch";
import { Badge } from "../../../../components/ui/badge";
import Image from 'next/image';

interface CrateWithItems extends DBCrate {
  items?: Array<{
    id: number;
    name: string;
    type: string;
    rarity: string;
    image?: string | null;
    dropChance: number;
  }>;
}

export default function AdminCratesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [crates, setCrates] = useState<CrateWithItems[]>([]);
  const [allItems, setAllItems] = useState<DBItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCrate, setEditingCrate] = useState<CrateWithItems | null>(null);
  const [showCrateDialog, setShowCrateDialog] = useState(false);
  const [showItemsDialog, setShowItemsDialog] = useState(false);
  const [selectedCrate, setSelectedCrate] = useState<CrateWithItems | null>(null);
  const [crateItems, setCrateItems] = useState<Array<{ item_id: number; drop_chance: number }>>([]);

  // Crate form state
  const [crateName, setCrateName] = useState('');
  const [crateDescription, setCrateDescription] = useState('');
  const [cratePrice, setCratePrice] = useState(0);
  const [crateImage, setCrateImage] = useState('');
  const [crateType, setCrateType] = useState('standard');
  const [xpReward, setXpReward] = useState(50);
  const [coinReward, setCoinReward] = useState(100);
  const [gemReward, setGemReward] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const queries = createSupabaseQueries(supabase);
      
      // Fetch all crates
      const cratesData = await queries.getAllCrates();
      
      // Fetch items for each crate
      const cratesWithItems = await Promise.all(
        cratesData.map(async (crate) => {
          try {
            const items = await queries.getCrateItems(crate.id);
            return {
              ...crate,
              items: items.map(ci => ({
                ...ci.item!,
                dropChance: ci.drop_chance
              }))
            };
          } catch {
            return { ...crate, items: [] };
          }
        })
      );
      
      setCrates(cratesWithItems);
      
      // Fetch all items for selection
      const { data: itemsData } = await supabase
        .from('items')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      setAllItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch crates data"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCrateName('');
    setCrateDescription('');
    setCratePrice(0);
    setCrateImage('');
    setCrateType('standard');
    setXpReward(50);
    setCoinReward(100);
    setGemReward(0);
    setIsActive(true);
    setEditingCrate(null);
  };

  const handleCreateCrate = () => {
    resetForm();
    setShowCrateDialog(true);
  };

  const handleEditCrate = (crate: CrateWithItems) => {
    setEditingCrate(crate);
    setCrateName(crate.name);
    setCrateDescription(crate.description || '');
    setCratePrice(crate.coin_price || 0);
    setCrateImage(crate.image_url || '');
    setCrateType(crate.type || 'standard');
    setXpReward(crate.xp_reward || 50);
    setCoinReward(crate.coin_reward || 100);
    setGemReward(crate.gem_reward || 0);
    setIsActive(crate.is_active !== false);
    setShowCrateDialog(true);
  };

  const handleSaveCrate = async () => {
    try {
      const crateData = {
        name: crateName,
        description: crateDescription,
        coin_price: cratePrice,
        image_url: crateImage,
        type: crateType,
        xp_reward: xpReward,
        coin_reward: coinReward,
        gem_reward: gemReward,
        is_active: isActive
      };

      if (editingCrate) {
        // Update existing crate
        const { error } = await supabase
          .from('crates')
          .update(crateData)
          .eq('id', editingCrate.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Crate updated successfully"
        });
      } else {
        // Create new crate
        const { error } = await supabase
          .from('crates')
          .insert([crateData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Crate created successfully"
        });
      }

      setShowCrateDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving crate:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save crate"
      });
    }
  };

  const handleDeleteCrate = async (crateId: number) => {
    if (!confirm('Are you sure you want to delete this crate?')) return;

    try {
      const { error } = await supabase
        .from('crates')
        .delete()
        .eq('id', crateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Crate deleted successfully"
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting crate:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete crate"
      });
    }
  };

  const handleManageItems = async (crate: CrateWithItems) => {
    setSelectedCrate(crate);
    
    // Fetch current items for this crate
    try {
      const queries = createSupabaseQueries(supabase);
      const items = await queries.getCrateItems(crate.id);
      setCrateItems(items.map(ci => ({
        item_id: ci.item_id,
        drop_chance: ci.drop_chance
      })));
    } catch {
      setCrateItems([]);
    }
    
    setShowItemsDialog(true);
  };

  const handleAddItem = () => {
    setCrateItems([...crateItems, { item_id: 0, drop_chance: 0.1 }]);
  };

  const handleUpdateItemChance = (index: number, field: 'item_id' | 'drop_chance', value: string | number) => {
    const updated = [...crateItems];
    if (field === 'item_id') {
      updated[index] = { ...updated[index], item_id: Number(value) };
    } else {
      updated[index] = { ...updated[index], drop_chance: Number(value) };
    }
    setCrateItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setCrateItems(crateItems.filter((_, i) => i !== index));
  };

  const handleSaveItems = async () => {
    if (!selectedCrate) return;

    try {
      // Delete all existing items for this crate
      await supabase
        .from('crate_items')
        .delete()
        .eq('crate_id', selectedCrate.id);

      // Insert new items
      const itemsToInsert = crateItems
        .filter(item => item.item_id > 0 && item.drop_chance > 0)
        .map(item => ({
          crate_id: selectedCrate.id,
          item_id: item.item_id,
          drop_chance: item.drop_chance
        }));

      if (itemsToInsert.length > 0) {
        const { error } = await supabase
          .from('crate_items')
          .insert(itemsToInsert);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Crate items updated successfully"
      });

      setShowItemsDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error saving items:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save crate items"
      });
    }
  };

  if (!user) {
    return <div className="p-8">Please log in to access admin panel</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Crates Management</h1>
          <p className="text-muted-foreground">Manage crates, items, and drop rates</p>
        </div>
        <Button onClick={handleCreateCrate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Crate
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Rewards</TableHead>
              <TableHead>Contents</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crates.map((crate) => (
              <TableRow key={crate.id}>
                <TableCell>
                  {crate.image_url ? (
                    <div className="relative w-16 h-16">
                      <Image
                        src={crate.image_url}
                        alt={crate.name}
                        width={64}
                        height={64}
                        className="object-contain rounded"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold">{crate.name}</p>
                    <p className="text-xs text-muted-foreground">{crate.type || 'standard'}</p>
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="text-sm text-muted-foreground truncate">{crate.description}</p>
                </TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-blue-400">XP:</span>
                      <span className="font-mono">{crate.xp_reward || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">Coins:</span>
                      <span className="font-mono">{crate.coin_reward || 0}</span>
                    </div>
                    {(crate.gem_reward || 0) > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-purple-400">Gems:</span>
                        <span className="font-mono">{crate.gem_reward}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageItems(crate)}
                  >
                    {crate.items?.length || 0} items
                  </Button>
                </TableCell>
                <TableCell>
                  <Badge variant={crate.is_active ? "default" : "secondary"}>
                    {crate.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => handleEditCrate(crate)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCrate(crate.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Crate Edit/Create Dialog */}
      <Dialog open={showCrateDialog} onOpenChange={setShowCrateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCrate ? 'Edit Crate' : 'Create New Crate'}</DialogTitle>
            <DialogDescription>
              Configure crate properties and rewards
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={crateName}
                onChange={(e) => setCrateName(e.target.value)}
                placeholder="Level Up Crate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={crateDescription}
                onChange={(e) => setCrateDescription(e.target.value)}
                placeholder="Earn this crate every time you level up!"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={crateType} onValueChange={setCrateType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="levelup">Level Up</SelectItem>
                  <SelectItem value="loyalty">Loyalty</SelectItem>
                  <SelectItem value="prestige">Prestige</SelectItem>
                  <SelectItem value="reward">Reward</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={crateImage}
                onChange={(e) => setCrateImage(e.target.value)}
                placeholder="/assets/crates/case1.png"
              />
              {crateImage && (
                <div className="mt-2 p-2 border rounded">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <div className="relative w-32 h-32 flex items-center justify-center bg-muted rounded">
                    <Image
                      src={crateImage}
                      alt="Crate preview"
                      width={128}
                      height={128}
                      className="object-contain rounded"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="text-xs text-muted-foreground">Image failed to load</div>';
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Rewards (when opening this crate)</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="xp" className="text-xs text-muted-foreground">XP Reward</Label>
                  <Input
                    id="xp"
                    type="number"
                    value={xpReward}
                    onChange={(e) => setXpReward(parseInt(e.target.value) || 0)}
                    placeholder="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coins" className="text-xs text-muted-foreground">Coin Reward</Label>
                  <Input
                    id="coins"
                    type="number"
                    value={coinReward}
                    onChange={(e) => setCoinReward(parseInt(e.target.value) || 0)}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gems" className="text-xs text-muted-foreground">Gem Reward</Label>
                  <Input
                    id="gems"
                    type="number"
                    value={gemReward}
                    onChange={(e) => setGemReward(parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCrateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCrate}>
              {editingCrate ? 'Update' : 'Create'} Crate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Items Management Dialog */}
      <Dialog open={showItemsDialog} onOpenChange={setShowItemsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Items - {selectedCrate?.name}</DialogTitle>
            <DialogDescription>
              Add items to this crate and set their drop chances (must total 1.0 or 100%)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button onClick={handleAddItem} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Drop Chance</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crateItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={item.item_id.toString()}
                        onValueChange={(value) => handleUpdateItemChance(index, 'item_id', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {allItems.map((dbItem) => (
                            <SelectItem key={dbItem.id} value={dbItem.id.toString()}>
                              {dbItem.name} ({dbItem.rarity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={item.drop_chance}
                        onChange={(e) => handleUpdateItemChance(index, 'drop_chance', parseFloat(e.target.value) || 0)}
                        placeholder="0.10"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-sm text-muted-foreground">
              Total drop chance: {crateItems.reduce((sum, item) => sum + item.drop_chance, 0).toFixed(4)} (should be 1.0)
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItems}>
              Save Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
