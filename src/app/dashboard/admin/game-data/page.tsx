'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Trophy,
  Award,
  Package,
  Target,
  Gift,
  Crown,
  Star,
  Zap
} from 'lucide-react';

interface Item {
  id: number;
  name: string;
  description: string;
  category: string;
  weapon_type?: string;
  rarity: string;
  coin_price: number;
  gem_price: number;
  sell_price: number;
  is_active: boolean;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  xp_reward: number;
  is_active: boolean;
}

interface Mission {
  id: number;
  name: string;
  description: string;
  mission_type: string;
  tier: number;
  xp_reward: number;
  coin_reward: number;
  requirement_type: string;
  requirement_value: number;
  is_repeatable: boolean;
  is_active: boolean;
}

interface Perk {
  id: number;
  name: string;
  description: string;
  category: string;
  perk_type: string;
  effect_value: number;
  duration_hours: number;
  coin_price: number;
  gem_price: number;
  is_active: boolean;
}

export default function GameDataManagerPage() {
  const [activeTab, setActiveTab] = useState('items');
  const [items, setItems] = useState<Item[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [perks, setPerks] = useState<Perk[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch data
  useEffect(() => {
    if (activeTab === 'items') fetchItems();
    if (activeTab === 'achievements') fetchAchievements();
    if (activeTab === 'missions') fetchMissions();
    if (activeTab === 'perks') fetchPerks();
  }, [activeTab]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/items');
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
    setIsLoading(false);
  };

  const fetchAchievements = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/achievements');
      const data = await response.json();
      setAchievements(data.achievements || []);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    }
    setIsLoading(false);
  };

  const fetchMissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/missions');
      const data = await response.json();
      setMissions(data.missions || []);
    } catch (error) {
      console.error('Failed to fetch missions:', error);
    }
    setIsLoading(false);
  };

  const fetchPerks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/perks');
      const data = await response.json();
      setPerks(data.perks || []);
    } catch (error) {
      console.error('Failed to fetch perks:', error);
    }
    setIsLoading(false);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'bg-gray-500';
      case 'uncommon': return 'bg-green-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'skin': return <Zap className="h-4 w-4" />;
      case 'knife': return <Star className="h-4 w-4" />;
      case 'gloves': return <Award className="h-4 w-4" />;
      case 'operator': return <Crown className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         achievement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || achievement.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredMissions = missions.filter(mission => {
    const matchesSearch = mission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || mission.mission_type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredPerks = perks.filter(perk => {
    const matchesSearch = perk.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         perk.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || perk.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Game Data Manager</h1>
          <p className="text-muted-foreground">Manage items, achievements, missions, and perks</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items, achievements, missions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {activeTab === 'items' && (
                  <>
                    <SelectItem value="skin">Skins</SelectItem>
                    <SelectItem value="knife">Knives</SelectItem>
                    <SelectItem value="gloves">Gloves</SelectItem>
                    <SelectItem value="operator">Operators</SelectItem>
                  </>
                )}
                {activeTab === 'achievements' && (
                  <>
                    <SelectItem value="betting">Betting</SelectItem>
                    <SelectItem value="economic">Economic</SelectItem>
                    <SelectItem value="progression">Progression</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                  </>
                )}
                {activeTab === 'missions' && (
                  <>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="main">Main</SelectItem>
                  </>
                )}
                {activeTab === 'perks' && (
                  <>
                    <SelectItem value="xp_boost">XP Boost</SelectItem>
                    <SelectItem value="cosmetic">Cosmetic</SelectItem>
                    <SelectItem value="utility">Utility</SelectItem>
                    <SelectItem value="betting">Betting</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Items ({items.length})
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Achievements ({achievements.length})
          </TabsTrigger>
          <TabsTrigger value="missions" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Missions ({missions.length})
          </TabsTrigger>
          <TabsTrigger value="perks" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Perks ({perks.length})
          </TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading items...</div>
          ) : (
            <div className="grid gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(item.category)}
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${getRarityColor(item.rarity)} text-white`}>
                          {item.rarity}
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-medium">{item.coin_price} coins</div>
                          {item.gem_price > 0 && (
                            <div className="text-xs text-blue-600">{item.gem_price} gems</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading achievements...</div>
          ) : (
            <div className="grid gap-4">
              {filteredAchievements.map((achievement) => (
                <Card key={achievement.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <div>
                          <h3 className="font-semibold">{achievement.name}</h3>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{achievement.category}</Badge>
                        <div className="text-right">
                          <div className="text-sm font-medium">{achievement.xp_reward} XP</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Missions Tab */}
        <TabsContent value="missions" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading missions...</div>
          ) : (
            <div className="grid gap-4">
              {filteredMissions.map((mission) => (
                <Card key={mission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-blue-500" />
                        <div>
                          <h3 className="font-semibold">{mission.name}</h3>
                          <p className="text-sm text-muted-foreground">{mission.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={mission.mission_type === 'daily' ? 'default' : 'secondary'}>
                          {mission.mission_type}
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-medium">{mission.xp_reward} XP</div>
                          {mission.coin_reward > 0 && (
                            <div className="text-xs text-yellow-600">{mission.coin_reward} coins</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Perks Tab */}
        <TabsContent value="perks" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading perks...</div>
          ) : (
            <div className="grid gap-4">
              {filteredPerks.map((perk) => (
                <Card key={perk.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Gift className="h-5 w-5 text-purple-500" />
                        <div>
                          <h3 className="font-semibold">{perk.name}</h3>
                          <p className="text-sm text-muted-foreground">{perk.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{perk.category}</Badge>
                        <div className="text-right">
                          <div className="text-sm font-medium">{perk.coin_price} coins</div>
                          {perk.duration_hours > 0 && (
                            <div className="text-xs text-blue-600">{perk.duration_hours}h duration</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">
              {items.filter(i => i.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievements.length}</div>
            <p className="text-xs text-muted-foreground">
              {achievements.filter(a => a.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Missions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{missions.length}</div>
            <p className="text-xs text-muted-foreground">
              {missions.filter(m => m.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Perks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{perks.length}</div>
            <p className="text-xs text-muted-foreground">
              {perks.filter(p => p.is_active).length} active
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}