'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Calendar, Percent, Image, Settings, Move, Eye, EyeOff, ArrowUp, ArrowDown, Layout, Sliders, GripVertical } from 'lucide-react';

interface FlashSale {
  id: string;
  name: string;
  description: string;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

interface FeaturedItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  item_type: string;
  rarity: string;
  price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface SiteSetting {
  key: string;
  value: any;
  type: string;
  description: string;
}

interface LandingPanel {
  id: string;
  name: string;
  type: 'hero' | 'flash_sale' | 'featured_items' | 'stats' | 'leaderboard' | 'activity_feed' | 'custom';
  position: number;
  is_visible: boolean;
  settings: Record<string, any>;
  created_at: string;
}

interface LandingSlider {
  id: string;
  name: string;
  images: string[];
  auto_play: boolean;
  interval: number;
  position: number;
  is_visible: boolean;
  created_at: string;
}

export default function LandingManagementPage() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, any>>({});
  const [landingPanels, setLandingPanels] = useState<LandingPanel[]>([]);
  const [landingSliders, setLandingSliders] = useState<LandingSlider[]>([]);
  const [loading, setLoading] = useState(true);
  const [flashSaleDialog, setFlashSaleDialog] = useState(false);
  const [featuredItemDialog, setFeaturedItemDialog] = useState(false);
  const [panelDialog, setPanelDialog] = useState(false);
  const [sliderDialog, setSliderDialog] = useState(false);
  const [editingFlashSale, setEditingFlashSale] = useState<FlashSale | null>(null);
  const [editingFeaturedItem, setEditingFeaturedItem] = useState<FeaturedItem | null>(null);
  const [editingPanel, setEditingPanel] = useState<LandingPanel | null>(null);
  const [editingSlider, setEditingSlider] = useState<LandingSlider | null>(null);
  const { toast } = useToast();

  // Flash Sale form state
  const [flashSaleForm, setFlashSaleForm] = useState({
    name: '',
    description: '',
    discount_percentage: 0,
    start_date: '',
    end_date: '',
    is_active: true
  });

  // Featured Item form state
  const [featuredItemForm, setFeaturedItemForm] = useState({
    name: '',
    description: '',
    image_url: '',
    item_type: '',
    rarity: '',
    price: 0,
    sort_order: 0,
    is_active: true
  });

  // Panel form state
  const [panelForm, setPanelForm] = useState({
    name: '',
    type: 'hero' as const,
    position: 0,
    is_visible: true,
    settings: {}
  });

  // Slider form state
  const [sliderForm, setSliderForm] = useState({
    name: '',
    images: [] as string[],
    auto_play: true,
    interval: 5000,
    position: 0,
    is_visible: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [flashSalesRes, featuredItemsRes, settingsRes, panelsRes, slidersRes] = await Promise.all([
        fetch('/api/landing/flash-sales'),
        fetch('/api/landing/featured-items'),
        fetch('/api/landing/site-settings'),
        fetch('/api/landing/panels'),
        fetch('/api/landing/sliders')
      ]);

      if (flashSalesRes.ok) {
        const sales = await flashSalesRes.json();
        setFlashSales(sales);
      }

      if (featuredItemsRes.ok) {
        const items = await featuredItemsRes.json();
        setFeaturedItems(items);
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setSiteSettings(settings);
      }

      if (panelsRes.ok) {
        const panels = await panelsRes.json();
        setLandingPanels(panels);
      }

      if (slidersRes.ok) {
        const sliders = await slidersRes.json();
        setLandingSliders(sliders);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch landing page data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Panel handlers
  const handlePanelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPanel ? '/api/landing/panels' : '/api/landing/panels';
      const method = editingPanel ? 'PUT' : 'POST';
      const body = editingPanel ? { ...panelForm, id: editingPanel.id } : panelForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingPanel ? 'Panel updated successfully' : 'Panel created successfully'
        });
        setPanelDialog(false);
        setEditingPanel(null);
        resetPanelForm();
        fetchData();
      } else {
        throw new Error('Failed to save panel');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save panel',
        variant: 'destructive'
      });
    }
  };

  const handleDeletePanel = async (id: string) => {
    try {
      const response = await fetch(`/api/landing/panels?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Panel deleted successfully'
        });
        fetchData();
      } else {
        throw new Error('Failed to delete panel');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete panel',
        variant: 'destructive'
      });
    }
  };

  const movePanel = async (id: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch('/api/landing/panels/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, direction })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Panel moved successfully'
        });
        fetchData();
      } else {
        throw new Error('Failed to move panel');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move panel',
        variant: 'destructive'
      });
    }
  };

  const togglePanelVisibility = async (id: string) => {
    try {
      const response = await fetch('/api/landing/panels/toggle-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Panel visibility updated'
        });
        fetchData();
      } else {
        throw new Error('Failed to toggle panel visibility');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle panel visibility',
        variant: 'destructive'
      });
    }
  };

  const openEditPanel = (panel: LandingPanel) => {
    setEditingPanel(panel);
    setPanelForm({
      name: panel.name,
      type: panel.type,
      position: panel.position,
      is_visible: panel.is_visible,
      settings: panel.settings
    });
    setPanelDialog(true);
  };

  const resetPanelForm = () => {
    setPanelForm({
      name: '',
      type: 'hero',
      position: 0,
      is_visible: true,
      settings: {}
    });
  };

  // Slider handlers
  const handleSliderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSlider ? '/api/landing/sliders' : '/api/landing/sliders';
      const method = editingSlider ? 'PUT' : 'POST';
      const body = editingSlider ? { ...sliderForm, id: editingSlider.id } : sliderForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingSlider ? 'Slider updated successfully' : 'Slider created successfully'
        });
        setSliderDialog(false);
        setEditingSlider(null);
        resetSliderForm();
        fetchData();
      } else {
        throw new Error('Failed to save slider');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save slider',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteSlider = async (id: string) => {
    try {
      const response = await fetch(`/api/landing/sliders?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Slider deleted successfully'
        });
        fetchData();
      } else {
        throw new Error('Failed to delete slider');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete slider',
        variant: 'destructive'
      });
    }
  };

  const openEditSlider = (slider: LandingSlider) => {
    setEditingSlider(slider);
    setSliderForm({
      name: slider.name,
      images: slider.images,
      auto_play: slider.auto_play,
      interval: slider.interval,
      position: slider.position,
      is_visible: slider.is_visible
    });
    setSliderDialog(true);
  };

  const resetSliderForm = () => {
    setSliderForm({
      name: '',
      images: [],
      auto_play: true,
      interval: 5000,
      position: 0,
      is_visible: true
    });
  };

  const handleFlashSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFlashSale ? '/api/landing/flash-sales' : '/api/landing/flash-sales';
      const method = editingFlashSale ? 'PUT' : 'POST';
      const body = editingFlashSale ? { ...flashSaleForm, id: editingFlashSale.id } : flashSaleForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingFlashSale ? 'Flash sale updated successfully' : 'Flash sale created successfully'
        });
        setFlashSaleDialog(false);
        setEditingFlashSale(null);
        resetFlashSaleForm();
        fetchData();
      } else {
        throw new Error('Failed to save flash sale');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save flash sale',
        variant: 'destructive'
      });
    }
  };

  const handleFeaturedItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFeaturedItem ? '/api/landing/featured-items' : '/api/landing/featured-items';
      const method = editingFeaturedItem ? 'PUT' : 'POST';
      const body = editingFeaturedItem ? { ...featuredItemForm, id: editingFeaturedItem.id } : featuredItemForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingFeaturedItem ? 'Featured item updated successfully' : 'Featured item created successfully'
        });
        setFeaturedItemDialog(false);
        setEditingFeaturedItem(null);
        resetFeaturedItemForm();
        fetchData();
      } else {
        throw new Error('Failed to save featured item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save featured item',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteFlashSale = async (id: string) => {
    try {
      const response = await fetch(`/api/landing/flash-sales?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Flash sale deleted successfully'
        });
        fetchData();
      } else {
        throw new Error('Failed to delete flash sale');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete flash sale',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteFeaturedItem = async (id: string) => {
    try {
      const response = await fetch(`/api/landing/featured-items?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Featured item deleted successfully'
        });
        fetchData();
      } else {
        throw new Error('Failed to delete featured item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete featured item',
        variant: 'destructive'
      });
    }
  };

  const resetFlashSaleForm = () => {
    setFlashSaleForm({
      name: '',
      description: '',
      discount_percentage: 0,
      start_date: '',
      end_date: '',
      is_active: true
    });
  };

  const resetFeaturedItemForm = () => {
    setFeaturedItemForm({
      name: '',
      description: '',
      image_url: '',
      item_type: '',
      rarity: '',
      price: 0,
      sort_order: 0,
      is_active: true
    });
  };

  const openEditFlashSale = (sale: FlashSale) => {
    setEditingFlashSale(sale);
    setFlashSaleForm({
      name: sale.name,
      description: sale.description,
      discount_percentage: sale.discount_percentage,
      start_date: sale.start_date,
      end_date: sale.end_date,
      is_active: sale.is_active
    });
    setFlashSaleDialog(true);
  };

  const openEditFeaturedItem = (item: FeaturedItem) => {
    setEditingFeaturedItem(item);
    setFeaturedItemForm({
      name: item.name,
      description: item.description,
      image_url: item.image_url,
      item_type: item.item_type,
      rarity: item.rarity,
      price: item.price,
      sort_order: item.sort_order,
      is_active: item.is_active
    });
    setFeaturedItemDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Landing Page Management</h1>
        <p className="text-muted-foreground">Manage flash sales, featured items, and site settings</p>
      </div>

      <Tabs defaultValue="layout" className="space-y-4">
        <TabsList>
          <TabsTrigger value="layout">Layout & Panels</TabsTrigger>
          <TabsTrigger value="sliders">Sliders</TabsTrigger>
          <TabsTrigger value="flash-sales">Flash Sales</TabsTrigger>
          <TabsTrigger value="featured-items">Featured Items</TabsTrigger>
          <TabsTrigger value="landing-settings">Landing Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Layout & Panels</h2>
            <Dialog open={panelDialog} onOpenChange={setPanelDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingPanel(null); resetPanelForm(); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Panel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPanel ? 'Edit Panel' : 'Create Panel'}</DialogTitle>
                  <DialogDescription>
                    {editingPanel ? 'Update the panel configuration' : 'Create a new landing page panel'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePanelSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="panel_name">Panel Name</Label>
                    <Input
                      id="panel_name"
                      value={panelForm.name}
                      onChange={(e) => setPanelForm({ ...panelForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel_type">Panel Type</Label>
                    <Select value={panelForm.type} onValueChange={(value: any) => setPanelForm({ ...panelForm, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hero">Hero Section</SelectItem>
                        <SelectItem value="flash_sale">Flash Sale Banner</SelectItem>
                        <SelectItem value="featured_items">Featured Items</SelectItem>
                        <SelectItem value="stats">Statistics</SelectItem>
                        <SelectItem value="leaderboard">Leaderboard</SelectItem>
                        <SelectItem value="activity_feed">Activity Feed</SelectItem>
                        <SelectItem value="custom">Custom Content</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panel_position">Position</Label>
                    <Input
                      id="panel_position"
                      type="number"
                      min="0"
                      value={panelForm.position}
                      onChange={(e) => setPanelForm({ ...panelForm, position: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="panel_visible"
                      checked={panelForm.is_visible}
                      onCheckedChange={(checked) => setPanelForm({ ...panelForm, is_visible: checked })}
                    />
                    <Label htmlFor="panel_visible">Visible</Label>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setPanelDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingPanel ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Panel Order & Visibility</CardTitle>
                <CardDescription>Drag to reorder panels or toggle visibility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {landingPanels.sort((a, b) => a.position - b.position).map((panel, index) => (
                    <div key={panel.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-2">
                          {panel.is_visible ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                          <span className="font-medium">{panel.name}</span>
                          <Badge variant="outline">{panel.type}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => movePanel(panel.id, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => movePanel(panel.id, 'down')}
                          disabled={index === landingPanels.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePanelVisibility(panel.id)}
                        >
                          {panel.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditPanel(panel)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Panel</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{panel.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePanel(panel.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sliders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Image Sliders</h2>
            <Dialog open={sliderDialog} onOpenChange={setSliderDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingSlider(null); resetSliderForm(); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Slider
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSlider ? 'Edit Slider' : 'Create Slider'}</DialogTitle>
                  <DialogDescription>
                    {editingSlider ? 'Update the slider configuration' : 'Create a new image slider'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSliderSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="slider_name">Slider Name</Label>
                    <Input
                      id="slider_name"
                      value={sliderForm.name}
                      onChange={(e) => setSliderForm({ ...sliderForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slider_images">Image URLs (one per line)</Label>
                    <Textarea
                      id="slider_images"
                      value={sliderForm.images.join('\n')}
                      onChange={(e) => setSliderForm({ ...sliderForm, images: e.target.value.split('\n').filter(url => url.trim()) })}
                      placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slider_interval">Auto-play Interval (ms)</Label>
                    <Input
                      id="slider_interval"
                      type="number"
                      min="1000"
                      step="1000"
                      value={sliderForm.interval}
                      onChange={(e) => setSliderForm({ ...sliderForm, interval: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slider_position">Position</Label>
                    <Input
                      id="slider_position"
                      type="number"
                      min="0"
                      value={sliderForm.position}
                      onChange={(e) => setSliderForm({ ...sliderForm, position: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="slider_auto_play"
                      checked={sliderForm.auto_play}
                      onCheckedChange={(checked) => setSliderForm({ ...sliderForm, auto_play: checked })}
                    />
                    <Label htmlFor="slider_auto_play">Auto-play</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="slider_visible"
                      checked={sliderForm.is_visible}
                      onCheckedChange={(checked) => setSliderForm({ ...sliderForm, is_visible: checked })}
                    />
                    <Label htmlFor="slider_visible">Visible</Label>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setSliderDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingSlider ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {landingSliders.map((slider) => (
              <Card key={slider.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {slider.name}
                        <Badge variant={slider.is_visible ? 'default' : 'secondary'}>
                          {slider.is_visible ? 'Visible' : 'Hidden'}
                        </Badge>
                        {slider.auto_play && <Badge variant="outline">Auto-play</Badge>}
                      </CardTitle>
                      <CardDescription>
                        {Array.isArray(slider.images) ? slider.images.length : 0} images • Position: {slider.position} • Interval: {slider.interval}ms
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditSlider(slider)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Slider</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{slider.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSlider(slider.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Array.isArray(slider.images) ? slider.images.slice(0, 4).map((image, index) => (
                      <div key={index} className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`Slider image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )) : (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">No images</span>
                      </div>
                    )}
                    {Array.isArray(slider.images) && slider.images.length > 4 && (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">+{slider.images.length - 4} more</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="flash-sales" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Flash Sales</h2>
            <Dialog open={flashSaleDialog} onOpenChange={setFlashSaleDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingFlashSale(null); resetFlashSaleForm(); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Flash Sale
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingFlashSale ? 'Edit Flash Sale' : 'Create Flash Sale'}</DialogTitle>
                  <DialogDescription>
                    {editingFlashSale ? 'Update the flash sale details' : 'Create a new flash sale banner'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleFlashSaleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Sale Name</Label>
                    <Input
                      id="name"
                      value={flashSaleForm.name}
                      onChange={(e) => setFlashSaleForm({ ...flashSaleForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={flashSaleForm.description}
                      onChange={(e) => setFlashSaleForm({ ...flashSaleForm, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount Percentage</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="1"
                      max="100"
                      value={flashSaleForm.discount_percentage}
                      onChange={(e) => setFlashSaleForm({ ...flashSaleForm, discount_percentage: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="datetime-local"
                        value={flashSaleForm.start_date}
                        onChange={(e) => setFlashSaleForm({ ...flashSaleForm, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="datetime-local"
                        value={flashSaleForm.end_date}
                        onChange={(e) => setFlashSaleForm({ ...flashSaleForm, end_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={flashSaleForm.is_active}
                      onCheckedChange={(checked) => setFlashSaleForm({ ...flashSaleForm, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setFlashSaleDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingFlashSale ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {flashSales.map((sale) => (
              <Card key={sale.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {sale.name}
                        <Badge variant={sale.is_active ? 'default' : 'secondary'}>
                          {sale.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{sale.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditFlashSale(sale)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Flash Sale</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{sale.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteFlashSale(sale.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      <span>{sale.discount_percentage}% OFF</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Starts: {new Date(sale.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Ends: {new Date(sale.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Created: {new Date(sale.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="featured-items" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Featured Items</h2>
            <Dialog open={featuredItemDialog} onOpenChange={setFeaturedItemDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingFeaturedItem(null); resetFeaturedItemForm(); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Featured Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingFeaturedItem ? 'Edit Featured Item' : 'Create Featured Item'}</DialogTitle>
                  <DialogDescription>
                    {editingFeaturedItem ? 'Update the featured item details' : 'Create a new featured item'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleFeaturedItemSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item_name">Item Name</Label>
                      <Input
                        id="item_name"
                        value={featuredItemForm.name}
                        onChange={(e) => setFeaturedItemForm({ ...featuredItemForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item_type">Item Type</Label>
                      <Input
                        id="item_type"
                        value={featuredItemForm.item_type}
                        onChange={(e) => setFeaturedItemForm({ ...featuredItemForm, item_type: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item_description">Description</Label>
                    <Textarea
                      id="item_description"
                      value={featuredItemForm.description}
                      onChange={(e) => setFeaturedItemForm({ ...featuredItemForm, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input
                      id="image_url"
                      value={featuredItemForm.image_url}
                      onChange={(e) => setFeaturedItemForm({ ...featuredItemForm, image_url: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rarity">Rarity</Label>
                      <Input
                        id="rarity"
                        value={featuredItemForm.rarity}
                        onChange={(e) => setFeaturedItemForm({ ...featuredItemForm, rarity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        value={featuredItemForm.price}
                        onChange={(e) => setFeaturedItemForm({ ...featuredItemForm, price: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sort_order">Sort Order</Label>
                      <Input
                        id="sort_order"
                        type="number"
                        min="0"
                        value={featuredItemForm.sort_order}
                        onChange={(e) => setFeaturedItemForm({ ...featuredItemForm, sort_order: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="item_is_active"
                      checked={featuredItemForm.is_active}
                      onCheckedChange={(checked) => setFeaturedItemForm({ ...featuredItemForm, is_active: checked })}
                    />
                    <Label htmlFor="item_is_active">Active</Label>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setFeaturedItemDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingFeaturedItem ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {featuredItems.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {item.name}
                        <Badge variant={item.is_active ? 'default' : 'secondary'}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditFeaturedItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Featured Item</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{item.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteFeaturedItem(item.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Type:</span> {item.item_type}
                      </div>
                      <div>
                        <span className="font-medium">Rarity:</span> {item.rarity}
                      </div>
                      <div>
                        <span className="font-medium">Price:</span> {item.price}
                      </div>
                      <div>
                        <span className="font-medium">Order:</span> {item.sort_order}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="landing-settings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Landing Page Settings</h2>
            <Button>
              <Settings className="mr-2 h-4 w-4" />
              Manage Settings
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Current Settings</CardTitle>
              <CardDescription>View and manage landing page specific settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(siteSettings).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{key}</span>
                      <p className="text-sm text-muted-foreground">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
