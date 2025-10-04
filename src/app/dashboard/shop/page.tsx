
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { ShopItemCard } from "../../../components/shop-item-card";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Button } from "../../../components/ui/button";
import { Search, Gem, Loader2, Coins, Gamepad2, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSupabase } from "../../../lib/supabase/context";
import { useBalance } from "../../../contexts/balance-context";
import { DBShopItem, Rarity } from "../../../lib/supabase/queries";

const FEATURE_HIGHLIGHTS = [
  {
    icon: Gem,
    title: "Premium Quality",
    description: "All items are verified authentic CS2 skins with guaranteed quality."
  },
  {
    icon: Coins,
    title: "Fair Pricing",
    description: "Competitive prices with regular discounts and special offers."
  },
  {
    icon: Gamepad2,
    title: "Instant Delivery",
    description: "Items are delivered immediately to your inventory upon purchase."
  }
  ];

  const shopPerkHighlights = [
    {
      icon: Gem,
      title: "Enhanced Experience",
      description: "Perks provide unique advantages and boost your gameplay experience."
    },
    {
      icon: Coins,
      title: "Earn or Buy",
      description: "Unlock perks through missions, predictions, or purchase with coins."
    },
    {
      icon: Gamepad2,
      title: "Exclusive Benefits",
      description: "Access special features and advantages not available to regular users."
    }
  ];

export default function ShopPage() {
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // Show 12 items per page
  const [shopItems, setShopItems] = useState<DBShopItem[]>([]);
  const [perks, setPerks] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('all');
  const { user } = useSupabase();
  const { balance: userBalance, isLoading } = useBalance();

  // Fetch shop items using API endpoint with fallback data
  const fetchShopItems = async () => {
    try {
      const response = await fetch('/api/shop');

      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];
        setShopItems(items);

        // Extract unique categories
        const uniqueCategories = [...new Set(items.map((item: DBShopItem) => item.item?.type ?? 'Unknown'))] as string[];
        setCategories(uniqueCategories);
      } else {
        console.error(`API responded with status: ${response.status}`);
        setShopItems([]);
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to fetch shop items:', error);
      // Clear items and indicate error state; UI will show friendly message
      setShopItems([]);
      setCategories([]);
    }
  };

  // Fetch perks from the perks API
  const fetchPerks = async () => {
    try {
      const response = await fetch('/api/shop/perks');
      
      if (response.ok) {
        const data = await response.json();
        setPerks(data.perks || []);
        console.log('✅ Loaded', data.perks?.length || 0, 'perks from database');
      } else {
        console.error(`Perks API responded with status: ${response.status}`);
        setPerks([]);
      }
    } catch (error) {
      console.error('Failed to fetch perks:', error);
      setPerks([]);
    }
  };

  useEffect(() => {
    fetchShopItems();
    fetchPerks();
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleSubTabChange = (value: string) => {
    setActiveSubTab(value);
    setCurrentPage(1); // Reset to first page when changing category
  };

  const sortItems = (items: DBShopItem[]) => {
    const rarityOrder: ('Legendary' | 'Epic' | 'Rare' | 'Uncommon' | 'Common')[] = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
    
    switch (sortBy) {
      case 'rarity':
        return [...items].sort((a, b) => {
          const aIndex = rarityOrder.indexOf(a.item?.rarity || 'Common');
          const bIndex = rarityOrder.indexOf(b.item?.rarity || 'Common');
          return bIndex - aIndex; // Higher rarity first
        });
      case 'price-low':
        return [...items].sort((a, b) => a.price - b.price);
      case 'price-high':
        return [...items].sort((a, b) => b.price - a.price);
      case 'new':
        return [...items].sort((a, b) => {
          const aDate = new Date(a.created_at);
          const bDate = new Date(b.created_at);
          return bDate.getTime() - aDate.getTime();
        });
      case 'name':
        return [...items].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return items;
    }
  };

  const filterItems = (items: DBShopItem[]) => {
    let filtered = items;
    
    if (searchTerm) {
      filtered = filtered.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return sortItems(filtered);
  };
  
  // renderItemGroup function removed - using renderPaginatedItems instead

  const renderPaginatedItems = () => {
    let filteredItems = shopItems;
    
    if (activeSubTab !== 'all') {
      filteredItems = shopItems.filter(item => item.item?.type === activeSubTab);
    }

    // Apply filtering and sorting to all items
    const filteredAndSortedItems = filterItems(filteredItems);
    
    if (filteredAndSortedItems.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No items found matching your criteria.</p>
        </div>
      );
    }

    // Calculate pagination
    const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredAndSortedItems.slice(startIndex, endIndex);

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-headline">
            {activeSubTab === 'all' ? 'All Items' : activeSubTab}
          </h2>
          <span className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedItems.length)} of {filteredAndSortedItems.length} items
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {paginatedItems.map(shopItem => <ShopItemCard key={shopItem.id} item={{
            ...shopItem,
            description: shopItem.description ?? 'No description available',
            type: shopItem.item?.type ?? 'Unknown',
            rarity: (shopItem.item?.rarity ?? 'Common') as Rarity,
            image: shopItem.item?.image ?? '/assets/placeholder.svg',
            dataAiHint: shopItem.item?.data_ai_hint ?? ''
          }} />)}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  const renderPaginatedPerks = () => {
    // Use actual perks from the perks API
    if (perks.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading perks...</p>
        </div>
      );
    }

    // Convert perks to shop item format for display
    const perkShopItems = perks
      .filter(perk => perk.is_active)
      .map(perk => ({
        id: `perk_${perk.id}`,
        name: perk.name,
        description: perk.description,
        price: perk.coin_price,
        gem_price: perk.gem_price,
        item_id: perk.id,
        category: perk.category,
        perk_type: perk.perk_type,
        effect_value: perk.effect_value,
        duration_hours: perk.duration_hours,
        is_consumable: perk.is_consumable,
        stock: 999,
        discount_percentage: 0,
        is_featured: false,
        is_active: true,
        created_at: perk.created_at,
        updated_at: perk.created_at,
        item: {
          id: perk.id,
          name: perk.name,
          description: perk.description,
          type: 'perk',
          rarity: 'Rare',
          image: `/assets/perks/${perk.category}.png`,
          data_ai_hint: `${perk.perk_type} perk providing ${perk.effect_value || 'special'} effect`,
          created_at: perk.created_at,
          category: perk.category,
          weapon_type: null,
          coin_price: perk.coin_price,
          gem_price: perk.gem_price,
          is_tradeable: false,
          is_sellable: false,
          is_equipable: false,
          sell_price: 0,
          is_active: perk.is_active,
          featured: false
        }
      }));

    // Apply search filtering
    let filteredPerks = perkShopItems;
    if (searchTerm) {
      filteredPerks = filteredPerks.filter(perk => 
        perk.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perk.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perk.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    const sortedPerks = sortItems(filteredPerks as DBShopItem[]);
    
    if (sortedPerks.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No perks found matching your criteria.</p>
        </div>
      );
    }

    // Calculate pagination
    const totalPages = Math.ceil(sortedPerks.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPerks = sortedPerks.slice(startIndex, endIndex);

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-headline">All Perks</h2>
          <span className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, sortedPerks.length)} of {sortedPerks.length} perks
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {paginatedPerks.map(perk => <ShopItemCard key={perk.id} item={{
            ...perk,
            description: perk.description ?? 'No description available',
            type: 'perk',
            rarity: 'Rare' as Rarity,
            image: perk.item?.image || '/assets/placeholder.svg',
            dataAiHint: perk.item?.data_ai_hint ?? ''
          }} />)}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  const PageHeader = ({ title, description }: { title: string, description: string}) => (
     <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">{title}</h1>
        <p className="text-muted-foreground max-w-4xl mx-auto mt-2">{description}</p>
        {user && (
          <div className="mt-4 flex justify-center">
            <Card className="w-fit">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading balance...</span>
                    </div>
                  ) : userBalance ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-green-400" />
                        <span className="font-bold text-lg">{userBalance.coins?.toLocaleString() || 0}</span>
                        <span className="text-muted-foreground">Coins</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Unable to load balance</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
  )

  const HighlightsSection = ({ highlights, title, footer }: { highlights: {icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; title: string; description: string}[], title: string, footer: string }) => (
    <>
      <Card>
          <CardHeader>
              <CardTitle className="text-center text-2xl font-bold font-headline">{title}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {highlights.map((feature: {icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; title: string; description: string}) => (
                  <div key={feature.title} className="flex items-start gap-4">
                      <feature.icon className="w-8 h-8 text-primary mt-1 shrink-0" />
                      <div>
                          <h3 className="font-semibold">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                  </div>
              ))}
          </CardContent>
        </Card>
        <p className='text-center text-muted-foreground text-sm'>{footer}</p>
    </>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <Tabs defaultValue="items">
        <div className='flex justify-center mb-8'>
          <TabsList className='grid grid-cols-3 w-full max-w-lg'>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="perks">Perks</TabsTrigger>
            <TabsTrigger value="cs2-skins" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              CS2 Skins
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="items" className='space-y-8'>
          <PageHeader 
            title="EquipGG.net Items – Unleash Your CS2 Style!"
            description="Step into the world of equipgg.net and collect an incredible array of items to showcase your CS2 prowess! From affordable common skins to rare legendary treasures, these items are yours to earn, craft, or purchase with virtual coins. Equip them to your profile, trade them up, or apply StatTrak&trade; to make them truly yours. Explore the full collection below and start building your ultimate arsenal!"
          />
          <div className="w-full">
            <div className='flex justify-between items-start md:items-center mb-4 flex-col md:flex-row gap-4'>
                <div className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground overflow-x-auto w-full md:w-auto min-w-0">
                    <button 
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeSubTab === 'all' ? 'bg-background text-foreground shadow-sm' : ''}`}
                       onClick={() => handleSubTabChange('all')}
                    >All</button>
                    {categories.map((category) => (
                      <button 
                        key={category}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeSubTab === category ? 'bg-background text-foreground shadow-sm' : ''}`}
                        onClick={() => handleSubTabChange(category)}
                      >{category}</button>
                    ))}
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                  <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[180px]">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="rarity">Rarity (High to Low)</SelectItem>
                      <SelectItem value="price-low">Price (Low to High)</SelectItem>
                      <SelectItem value="price-high">Price (High to Low)</SelectItem>
                      <SelectItem value="new">Newest First</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </div>

            <div className="mt-6" key={`items-${sortBy}-${activeSubTab}-${currentPage}`}>
              {renderPaginatedItems()}
            </div>
          </div>
          <HighlightsSection 
            highlights={FEATURE_HIGHLIGHTS}
            title="Why These Items Are a Must-Have"
            footer="Start collecting your favorite items on equipgg.net today—unbox crates, craft masterpieces, and dominate with style!"
          />
        </TabsContent>

        <TabsContent value="perks" className='space-y-8'>
          <PageHeader 
            title="EquipGG.net Perks – Unlock the Power to Dominate!"
            description="Elevate your equipgg.net journey with our incredible perks! Earned through missions, predictions, or purchased with virtual coins, these boosts and enhancements let you stand out, level up faster, and enjoy exclusive advantages. Dive into the full list below and discover how to supercharge your CS2 adventure!"
          />
           <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search perks..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="rarity">Rarity (High to Low)</SelectItem>
                  <SelectItem value="price-low">Price (Low to High)</SelectItem>
                  <SelectItem value="price-high">Price (High to Low)</SelectItem>
                  <SelectItem value="new">Newest First</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
           <div key={`perks-${sortBy}-${currentPage}`}>
             {renderPaginatedPerks()}
           </div>
           <HighlightsSection
            highlights={shopPerkHighlights}
            title="Why These Perks Are a Game-Changer"
            footer="Unlock these perks through your skillful predictions, mission completions, or coin purchases in the shop. Each one is designed to make your equipgg.net experience more rewarding and fun—start collecting today and dominate the CS2 world!"
           />
        </TabsContent>

        <TabsContent value="cs2-skins" className='space-y-8'>
          <PageHeader 
            title="CS2 Skin Marketplace – Buy Real Skins with Gems!"
            description="Purchase real CS2 skins with gems! These are actual skins that will be delivered to your Steam inventory via trade offers. Choose from knives, gloves, and weapon skins across all rarity levels."
          />
          
          <div className="text-center py-8">
            <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-semibold mb-2">CS2 Skin Shop</h3>
            <p className="text-muted-foreground mb-4">
              The CS2 skin marketplace is integrated into the shop! Use gems to purchase real CS2 skins.
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg">
                <Gem className="h-5 w-5 text-yellow-400" />
                <span className="font-bold">{userBalance?.gems?.toLocaleString() || 0}</span>
                <span className="text-muted-foreground">Gems Available</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              CS2 skins will be delivered to your Steam inventory within 24-48 hours after purchase.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
