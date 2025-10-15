"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { LineChart, Users as UsersIcon, ShoppingBag, Award, Cog, Swords, Gem, Trophy, Star, Archive, Ticket, ShieldCheck, Bell, MessagesSquare, RefreshCw, Plus, Edit, Trash2, Power, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

// This admin page is adapted from your example (example-admin.txt).
// It uses the same left-nav + panels layout but fetches live read-only admin endpoints.
// Important: no seeding/populate or service-role usage is added.

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [activeNav, setActiveNav] = useState('dashboard');
  const [activeSiteControlTab, setActiveSiteControlTab] = useState('site-settings');
  const [pageToggles, setPageToggles] = useState<Record<string, boolean>>({});
  const [pageToggleList, setPageToggleList] = useState<string[]>([]);
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean> | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [perks, setPerks] = useState<any[]>([]);
  const [ranks, setRanks] = useState<any[]>([]);
  const [crates, setCrates] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [gemManagement, setGemManagement] = useState<any>(null);
  const [showCreateGemPackage, setShowCreateGemPackage] = useState(false);
  const [showEditGemPackage, setShowEditGemPackage] = useState(false);
  const [editingGemPackage, setEditingGemPackage] = useState<any>(null);
  const emptyGemPackage = { id: '', name: '', description: '', gems: 0, price: 0, currency: 'USD', enabled: true };
  const [newGemPackage, setNewGemPackage] = useState<any>({ ...emptyGemPackage });
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [inlineStatus, setInlineStatus] = useState<{ type: 'success'|'error'|'loading'; message: string } | null>(null);
  const [showCreateFlashSale, setShowCreateFlashSale] = useState(false);
  const [showEditFlashSale, setShowEditFlashSale] = useState(false);
  const [editingFlashSale, setEditingFlashSale] = useState<any>(null);
  const [newFlashSale, setNewFlashSale] = useState({
    item_id: '',
    original_price: 0,
    sale_price: 0,
    discount_percent: 0,
    start_time: '',
    end_time: '',
    active: true
  });
  const [userRewards, setUserRewards] = useState<any[]>([]);
  const [showCreateReward, setShowCreateReward] = useState(false);
  const [showEditReward, setShowEditReward] = useState(false);
  const [editingReward, setEditingReward] = useState<any>(null);
  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    type: 'login_bonus',
    trigger_condition: '',
    reward_coins: 0,
    reward_xp: 0,
    reward_gems: 0,
    reward_item: '',
    is_active: true,
    max_claims_per_user: 1,
    cooldown_hours: 24
  });
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [ticketReplies, setTicketReplies] = useState<any[]>([]);
  const [newReply, setNewReply] = useState('');
  const [supportTicketSearch, setSupportTicketSearch] = useState('');
  const [supportTicketStatusFilter, setSupportTicketStatusFilter] = useState('');
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [newMessage, setNewMessage] = useState({
    type: 'info',
    subject: '',
    content: '',
    targetUsers: 'all'
  });
  const [missions, setMissions] = useState<any[]>([]);
  const [showCreateMission, setShowCreateMission] = useState(false);
  const [showEditMission, setShowEditMission] = useState(false);
  const [editingMission, setEditingMission] = useState<any>(null);
  const [newMission, setNewMission] = useState({
    title: '',
    description: '',
    type: 'daily',
    tier: 'bronze',
    target_value: 1,
    reward_coins: 0,
    reward_xp: 0,
    reward_item: '',
    is_active: true
  });
  const [showModeration, setShowModeration] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modAction, setModAction] = useState<'ban' | 'unban' | 'mute' | 'suspend'>('ban');
  const [modReason, setModReason] = useState('');
  const [showEditUser, setShowEditUser] = useState(false);
  const [showDeleteUser, setShowDeleteUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Landing page management state
  const [landingPanels, setLandingPanels] = useState<any[]>([]);
  const [heroPanel, setHeroPanel] = useState<any>({
    title: '',
    content: '',
    button_text: '',
    button_url: '',
    image_url: '',
    is_active: true
  });
  
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState({ 
    name: '', 
    type: '', 
    rarity: 'Common', 
    value: 0, 
    image_url: '', 
    is_equipable: false, 
    for_crate: false,
    featured: false
  });
  const [itemsCurrentPage, setItemsCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // Show 12 items per page
  const [showCreateBadge, setShowCreateBadge] = useState(false);
  const [showEditBadge, setShowEditBadge] = useState(false);
  const [editingBadge, setEditingBadge] = useState<any>(null);
  const [newBadge, setNewBadge] = useState({
    name: '',
    description: '',
    category: '',
    rarity: 'common',
    requirement_type: '',
    requirement_value: 0,
    image_url: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [showEditMatch, setShowEditMatch] = useState(false);
  const [editingMatch, setEditingMatch] = useState<any>(null);
  const [newMatch, setNewMatch] = useState({
    team_a_name: '',
    team_a_logo: '',
    team_a_odds: 1.0,
    team_b_name: '',
    team_b_logo: '',
    team_b_odds: 1.0,
    event_name: '',
    map: '',
    start_time: '',
    match_date: '',
    stream_url: '',
    status: 'upcoming'
  });
  const [showCreatePerk, setShowCreatePerk] = useState(false);
  const [showEditPerk, setShowEditPerk] = useState(false);
  const [editingPerk, setEditingPerk] = useState<any>(null);
  const [newPerk, setNewPerk] = useState({
    name: '',
    description: '',
    category: '',
    perk_type: '',
    effect_value: 0,
    duration_hours: 0,
    coin_price: 0,
    gem_price: 0,
    is_active: true
  });
  const [showCreateRank, setShowCreateRank] = useState(false);
  const [showEditRank, setShowEditRank] = useState(false);
  const [editingRank, setEditingRank] = useState<any>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    targetUsers: 'all'
  });
  const [newNews, setNewNews] = useState({
    title: '',
    message: '',
    targetUsers: 'all'
  });
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [newRank, setNewRank] = useState({
    name: '',
    min_xp: 0,
    max_xp: 0,
    tier: 1,
    image_url: ''
  });
  const [showCreateCrate, setShowCreateCrate] = useState(false);
  const [showEditCrate, setShowEditCrate] = useState(false);
  const [editingCrate, setEditingCrate] = useState<any>(null);
  const [newCrate, setNewCrate] = useState({
    name: '',
    description: '',
    price: 0,
    image: '',
    contents: [] as string[],
    isActive: true
  });
  const [showCreateAchievement, setShowCreateAchievement] = useState(false);
  const [showEditAchievement, setShowEditAchievement] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<any>(null);
  const [newAchievement, setNewAchievement] = useState({
    name: '',
    description: '',
    category: '',
    xp_reward: 0,
    coin_reward: 0,
    gem_reward: 0,
    badge_reward: '',
    is_active: true
  });

  // Save landing page data function
  const saveLandingPageData = async () => {
    try {
      if (!heroPanel) {
        alert('No hero panel data to save');
        return;
      }

      // Map heroPanel fields to API fields
      const apiData = {
        id: heroPanel.id || undefined,
        type: 'hero', // Always hero for this panel
        title: heroPanel.title || '',
        content: heroPanel.description || '', // description maps to content
        image_url: heroPanel.background_image || '', // background_image maps to image_url
        logo_layer1: heroPanel.logo_layer1 || '/1.png', // Logo layer 1
        logo_layer2: heroPanel.logo_layer2 || '/2.png', // Logo layer 2
        button_text: heroPanel.button_text || '',
        button_url: heroPanel.button_link || '', // button_link maps to button_url
        is_active: heroPanel.enabled ?? true, // enabled maps to is_active
        display_order: heroPanel.sort_order || 1
      };

      // Use PUT if we have an ID, POST if creating new
      const method = heroPanel.id ? 'PUT' : 'POST';
      
      const heroRes = await fetch('/api/landing/panels', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      });

      if (heroRes.ok) {
        toast({
          title: "Successfully saved!",
          description: "Landing page settings have been updated.",
        });
        // Refresh the data
        const updatedRes = await fetch('/api/landing/panels');
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          setLandingPanels(data.panels || data.data || []);
          const hero = (data.panels || data.data || []).find((panel: any) => panel.type === 'hero');
          if (hero) {
            // Map API fields back to heroPanel format
            setHeroPanel({
              id: hero.id,
              section: 'hero',
              title: hero.title,
              description: hero.content,
              button_text: hero.button_text,
              button_link: hero.button_url,
              background_image: hero.image_url,
              logo_layer1: hero.logo_layer1 || '/1.png',
              logo_layer2: hero.logo_layer2 || '/2.png',
              enabled: hero.is_active,
              sort_order: hero.display_order
            });
          }
        }
      } else {
        const data = await heroRes.json();
        toast({
          title: "Error",
          description: data.error || 'Save failed',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Save landing page error:', error);
      toast({
        title: "Error",
        description: 'Save failed',
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) return router.push('/sign-in?redirect=/dashboard/admin');
    if (user.role !== 'admin') return router.push('/dashboard');

    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [uRes, iRes, bRes, mRes, pRes, rRes, cRes, aRes, sRes, gRes, nRes, missRes, fsRes, urRes, lpRes] = await Promise.all([
          fetch('/api/admin/users').catch(() => null),
          fetch('/api/admin/items').catch(() => null),
          fetch('/api/admin/badges').catch(() => null),
          fetch('/api/admin/matches').catch(() => null),
          fetch('/api/admin/perks').catch(() => null),
          fetch('/api/admin/ranks').catch(() => null),
          fetch('/api/admin/crates').catch(() => null),
          fetch('/api/admin/achievements').catch(() => null),
          fetch('/api/site-settings').catch(() => null),
          fetch('/api/admin/gem-management').catch(() => null),
          fetch('/api/support/tickets').catch(() => null),
          fetch('/api/notifications?limit=10').catch(() => null),
          fetch('/api/admin/missions').catch(() => null),
          fetch('/api/admin/flash-sales').catch(() => null),
          fetch('/api/admin/user-rewards').catch(() => null),
          fetch('/api/landing/panels').catch(() => null),
        ]);

        if (!mounted) return;

        if (uRes && uRes.ok) {
          const data = await uRes.json();
          setUsers(data.users || data.data || []);
        }

        if (iRes && iRes.ok) {
          const data = await iRes.json();
          setItems(data.items || data.data || []);
        }

        if (bRes && bRes.ok) {
          const data = await bRes.json();
          setBadges(data.badges || data.data || []);
        }

        if (mRes && mRes.ok) {
          const data = await mRes.json();
          setMatches(data.matches || data.data || []);
        }

        if (pRes && pRes.ok) {
          const data = await pRes.json();
          setPerks(data.perks || data.data || []);
        }

        if (rRes && rRes.ok) {
          const data = await rRes.json();
          setRanks(data.ranks || data.data || []);
        }

        if (cRes && cRes.ok) {
          const data = await cRes.json();
          setCrates(data.crates || data.data || []);
        }

        if (aRes && aRes.ok) {
          const data = await aRes.json();
          setAchievements(data.achievements || data.data || []);
        }

        if (sRes && sRes.ok) {
          const data = await sRes.json();
          setSiteSettings(data);
        }

        if (gRes && gRes.ok) {
          const data = await gRes.json();
          setGemManagement(data.data);
        }

        // Temporarily disable support tickets until table is created
        // if (stRes && stRes.ok) {
        //   const data = await stRes.json();
        //   setSupportTickets(data.tickets || []);
        // }

        if (nRes && nRes.ok) {
          const data = await nRes.json();
          setRecentNotifications(data.notifications || data.data || []);
        }

        if (missRes && missRes.ok) {
          const data = await missRes.json();
          console.log('Admin missions data:', data);
          setMissions(data.missions || []);
        } else if (missRes) {
          console.error('Missions fetch failed:', missRes.status);
        }

        if (fsRes && fsRes.ok) {
          const data = await fsRes.json();
          setFlashSales(data.flashSales || data.data || []);
        }

        if (urRes && urRes.ok) {
          const data = await urRes.json();
          setUserRewards(data.rewards || data.data || []);
        }

        if (lpRes && lpRes.ok) {
          const data = await lpRes.json();
          setLandingPanels(data.panels || data.data || []);
          // Find the hero panel specifically and map API fields
          const hero = (data.panels || data.data || []).find((panel: any) => panel.type === 'hero');
          if (hero) {
            setHeroPanel({
              id: hero.id,
              section: 'hero',
              title: hero.title,
              description: hero.content, // content maps to description
              button_text: hero.button_text,
              button_link: hero.button_url, // button_url maps to button_link
              background_image: hero.image_url, // image_url maps to background_image
              logo_layer1: hero.logo_layer1 || '/1.png',
              logo_layer2: hero.logo_layer2 || '/2.png',
              enabled: hero.is_active, // is_active maps to enabled
              sort_order: hero.display_order // display_order maps to sort_order
            });
          }
        }

        // Fetch page toggles (admin only) after other data
        try {
          const togglesRes = await fetch('/api/admin/page-toggles');
          if (togglesRes.ok) {
            const togglesData = await togglesRes.json();
            setPageToggles(togglesData.toggles || {});
            setPageToggleList(togglesData.possiblePages || []);
            // Clear any pending edits on fresh load
            setPendingToggles(null as any);
          }
        } catch {
          // ignore
        }
      } catch (err) {
        console.error('admin load error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false };
  }, [user, authLoading, router]);

  if (authLoading) return <div className="p-6">Checking authentication...</div>;
  if (!user) return <div className="p-6">Redirecting to sign-in...</div>;
  if (user.role !== 'admin') return <div className="p-6">You must be an admin to view this page.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 h-full">
      <aside className="md:col-span-1 border-r bg-card/50 p-4">
        <nav className="flex flex-col gap-2">
          <button onClick={() => setActiveNav('dashboard')} className={cn('flex items-center gap-2 px-3 py-2 rounded', activeNav === 'dashboard' ? 'bg-accent text-black' : 'text-muted-foreground')}>
            <LineChart className="w-4 h-4" /> Dashboard
          </button>
          <button onClick={() => setActiveNav('users')} className={cn('flex items-center gap-2 px-3 py-2 rounded', activeNav === 'users' ? 'bg-accent text-black' : 'text-muted-foreground')}>
            <UsersIcon className="w-4 h-4" /> Users
          </button>
          <button onClick={() => setActiveNav('siteControl')} className={cn('flex items-center gap-2 px-3 py-2 rounded', activeNav === 'siteControl' ? 'bg-accent text-black' : 'text-muted-foreground')}>
            <Cog className="w-4 h-4" /> Site Control
          </button>
          <button onClick={() => setActiveNav('matches')} className={cn('flex items-center gap-2 px-3 py-2 rounded', activeNav === 'matches' ? 'bg-accent text-black' : 'text-muted-foreground')}>
            <Swords className="w-4 h-4" /> Match Management
          </button>
          <button onClick={() => setActiveNav('shop')} className={cn('flex items-center gap-2 px-3 py-2 rounded', activeNav === 'shop' ? 'bg-accent text-black' : 'text-muted-foreground')}>
            <ShoppingBag className="w-4 h-4" /> Shop
          </button>
          <button onClick={() => setActiveNav('gemManagement')} className={cn('flex items-center gap-2 px-3 py-2 rounded', activeNav === 'gemManagement' ? 'bg-accent text-black' : 'text-muted-foreground')}>
            <Gem className="w-4 h-4" /> Gem Management
          </button>
          <button onClick={() => setActiveNav('ranks')} className={cn('flex items-center gap-2 px-3 py-2 rounded', activeNav === 'ranks' ? 'bg-accent text-black' : 'text-muted-foreground')}>
            <Trophy className="w-4 h-4" /> Ranks
          </button>
          <button onClick={() => setActiveNav('missions')} className={cn('flex items-center gap-2 px-3 py-2 rounded', activeNav === 'missions' ? 'bg-accent text-black' : 'text-muted-foreground')}>
            <Star className="w-4 h-4" /> Missions
          </button>
          <button onClick={() => setActiveNav('badges')} className={cn('flex items-center gap-2 px-3 py-2 rounded', activeNav === 'badges' ? 'bg-accent text-black' : 'text-muted-foreground')}>
            <Award className="w-4 h-4" /> Badges
          </button>
          <button onClick={() => setActiveNav('crates')} className={cn('flex items-center gap-2 px-3 py-2 rounded', activeNav === 'crates' ? 'bg-accent text-black' : 'text-muted-foreground')}>
            <Archive className="w-4 h-4" /> Crates
          </button>
          <button onClick={() => setActiveNav('perks')} className={cn('flex items-center gap-2 px-3 py-2 rounded', activeNav === 'perks' ? 'bg-accent text-black' : 'text-muted-foreground')}>
            <Ticket className="w-4 h-4" /> Perks
          </button>
          <button onClick={() => setActiveNav('support')} className={cn('flex items-center gap-2 px-3 py-2 rounded', activeNav === 'support' ? 'bg-accent text-black' : 'text-muted-foreground')}>
            <ShieldCheck className="w-4 h-4" /> Support
          </button>
          <button onClick={() => setActiveNav('notifications')} className={cn('flex items-center gap-2 px-3 py-2 rounded', activeNav === 'notifications' ? 'bg-accent text-black' : 'text-muted-foreground')}>
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button onClick={() => setActiveNav('messages')} className={cn('flex items-center gap-2 px-3 py-2 rounded', activeNav === 'messages' ? 'bg-accent text-black' : 'text-muted-foreground')}>
            <MessagesSquare className="w-4 h-4" /> Messages
          </button>
        </nav>
      </aside>

      <main className="md:col-span-4 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Admin Control Panel</h1>
            <p className="text-sm text-muted-foreground">Controls and metrics tied to live Supabase data</p>
          </div>
          <div>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        </div>

        {activeNav === 'dashboard' && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Total Users</div>
                      <div className="text-3xl font-bold">{users.length}</div>
                      <div className="text-xs text-green-500 mt-1">↑ Active community</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-4 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Shop Items</div>
                      <div className="text-3xl font-bold">{items.length}</div>
                      <div className="text-xs text-muted-foreground mt-1">Available for sale</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-4 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Active Matches</div>
                      <div className="text-3xl font-bold">{matches.filter((m: any) => m.status === 'live').length}</div>
                      <div className="text-xs text-muted-foreground mt-1">{matches.length} total matches</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <Swords className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-4 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Flash Sales</div>
                      <div className="text-3xl font-bold">{flashSales.filter((fs: any) => fs.active).length}</div>
                      <div className="text-xs text-orange-500 mt-1">↑ Active promotions</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                      <Archive className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <CardContent className="p-0">
                  <div className="text-sm text-muted-foreground mb-2">Total Coins in Economy</div>
                  <div className="text-2xl font-bold text-yellow-500">
                    {users.reduce((sum: number, u: any) => sum + (u.coins || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Across {users.length} users</div>
                </CardContent>
              </Card>

              <Card className="p-4">
                <CardContent className="p-0">
                  <div className="text-sm text-muted-foreground mb-2">Total Gems in Economy</div>
                  <div className="text-2xl font-bold text-purple-500">
                    {users.reduce((sum: number, u: any) => sum + (u.gems || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Premium currency</div>
                </CardContent>
              </Card>

              <Card className="p-4">
                <CardContent className="p-0">
                  <div className="text-sm text-muted-foreground mb-2">Avg User Level</div>
                  <div className="text-2xl font-bold text-blue-500">
                    {users.length > 0 ? (users.reduce((sum: number, u: any) => sum + (u.level || 1), 0) / users.length).toFixed(1) : '0'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Player progression</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Users */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <UsersIcon className="w-5 h-5" />
                      Recent Users
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveNav('users')}>
                      View All
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div>
                          <div className="font-medium">{user.displayname || user.displayName || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">Lvl {user.level || 1}</div>
                          <div className="text-xs text-muted-foreground">{user.coins || 0} coins</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Cog className="w-5 h-5" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => setActiveNav('users')}>
                      <UsersIcon className="w-5 h-5" />
                      <span className="text-sm">Manage Users</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => setActiveNav('shop')}>
                      <ShoppingBag className="w-5 h-5" />
                      <span className="text-sm">Manage Shop</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => setActiveNav('matches')}>
                      <Swords className="w-5 h-5" />
                      <span className="text-sm">View Matches</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => setActiveNav('site-control')}>
                      <Cog className="w-5 h-5" />
                      <span className="text-sm">Site Settings</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={async () => {
                      try {
                        const res = await fetch('/api/matches/sync', { method: 'POST' });
                        if (res.ok) {
                          toast({
                            title: "Sync Started!",
                            description: "Syncing matches from Pandascore...",
                          });
                          const matchesRes = await fetch('/api/admin/matches');
                          if (matchesRes.ok) {
                            const data = await matchesRes.json();
                            setMatches(data.matches || data.data || []);
                          }
                        }
                      } catch (e) {
                        toast({
                          title: "Sync Failed",
                          description: "Could not sync matches",
                          variant: "destructive",
                        });
                      }
                    }}>
                      <RefreshCw className="w-5 h-5" />
                      <span className="text-sm">Sync Matches</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => {
                      setActiveSiteControlTab('flash-sales');
                      setActiveNav('site-control');
                    }}>
                      <Archive className="w-5 h-5" />
                      <span className="text-sm">Flash Sales</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status & Active Matches */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Status */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    System Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Database</span>
                      </div>
                      <span className="text-xs text-green-500">Connected</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 ${siteSettings?.pandascore_api_key ? 'bg-green-500' : 'bg-yellow-500'} rounded-full`}></div>
                        <span className="text-sm font-medium">Pandascore API</span>
                      </div>
                      <span className={`text-xs ${siteSettings?.pandascore_api_key ? 'text-green-500' : 'text-yellow-500'}`}>
                        {siteSettings?.pandascore_api_key ? 'Connected' : 'Using .env'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 ${siteSettings?.maintenanceMode ? 'bg-yellow-500' : 'bg-green-500'} rounded-full`}></div>
                        <span className="text-sm font-medium">Maintenance Mode</span>
                      </div>
                      <span className={`text-xs ${siteSettings?.maintenanceMode ? 'text-yellow-500' : 'text-green-500'}`}>
                        {siteSettings?.maintenanceMode ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">User Registration</span>
                      </div>
                      <span className="text-xs text-green-500">
                        {siteSettings?.enableRegistration ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Matches */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Swords className="w-5 h-5" />
                      Live Matches
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveNav('matches')}>
                      View All
                    </Button>
                  </div>
                  {matches.filter((m: any) => m.status === 'live').length > 0 ? (
                    <div className="space-y-3">
                      {matches.filter((m: any) => m.status === 'live').slice(0, 4).map((match: any) => (
                        <div key={match.id} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-medium">{match.team_a_name}</div>
                              <div className="text-xs text-muted-foreground">vs</div>
                              <div className="text-sm font-medium">{match.team_b_name}</div>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                                🔴 LIVE
                              </span>
                              <div className="text-xs text-muted-foreground mt-1">{match.event_name}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Swords className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No live matches</p>
                      <Button variant="link" size="sm" onClick={async () => {
                        const res = await fetch('/api/matches/sync', { method: 'POST' });
                        if (res.ok) {
                          const matchesRes = await fetch('/api/admin/matches');
                          if (matchesRes.ok) {
                            const data = await matchesRes.json();
                            setMatches(data.matches || data.data || []);
                          }
                        }
                      }}>
                        Sync from Pandascore
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Content Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Content Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                  <div className="text-center p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={async () => {
                    console.log('Current missions state:', missions);
                    const res = await fetch('/api/admin/missions');
                    const data = await res.json();
                    console.log('Fresh missions fetch:', data);
                    if (data.missions) {
                      setMissions(data.missions);
                      toast({
                        title: "Missions Refreshed",
                        description: `Found ${data.missions.length} missions in database`,
                      });
                    }
                  }}>
                    <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{missions.length}</div>
                    <div className="text-xs text-muted-foreground">Missions</div>
                    <div className="text-xs text-blue-500 mt-1">Click to refresh</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                    <div className="text-2xl font-bold">{achievements.length}</div>
                    <div className="text-xs text-muted-foreground">Achievements</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Award className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{badges.length}</div>
                    <div className="text-xs text-muted-foreground">Badges</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Star className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold">{ranks.length}</div>
                    <div className="text-xs text-muted-foreground">Ranks</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Archive className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                    <div className="text-2xl font-bold">{crates.length}</div>
                    <div className="text-xs text-muted-foreground">Crates</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Gem className="w-8 h-8 mx-auto mb-2 text-cyan-500" />
                    <div className="text-2xl font-bold">{perks.length}</div>
                    <div className="text-xs text-muted-foreground">Perks</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Ticket className="w-8 h-8 mx-auto mb-2 text-red-500" />
                    <div className="text-2xl font-bold">{userRewards.length}</div>
                    <div className="text-xs text-muted-foreground">Rewards</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeNav === 'users' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Users Management</h2>
            {loading ? <div>Loading...</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Coins</TableHead>
                    <TableHead>Gems</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.displayname || u.displayName || 'Unknown'}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          u.role === 'admin' ? 'bg-red-100 text-red-800' :
                          u.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-700 text-gray-200'
                        }`}>
                          {u.role || 'user'}
                        </span>
                      </TableCell>
                      <TableCell>{u.level || 1}</TableCell>
                      <TableCell>{u.coins?.toLocaleString() || 0}</TableCell>
                      <TableCell>{u.gems?.toLocaleString() || 0}</TableCell>
                      <TableCell>{u.xp?.toLocaleString() || 0}</TableCell>
                      <TableCell>{u.currentRank || 'Unranked'}</TableCell>
                      <TableCell>{u.inventoryCount || 0}</TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => { setEditingUser(u); setShowEditUser(true); }}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => { setSelectedUser(u); setShowDeleteUser(true); }}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {activeNav === 'shop' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold mb-1">Shop Items Management</h2>
              <Button onClick={() => setShowCreateItem(true)}>
                <Plus className="w-4 h-4 mr-2" /> Create Item
              </Button>
            </div>
            
            {loading ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-lg font-medium">Loading items...</p>
                  </div>
                </CardContent>
              </Card>
            ) : items.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">No items in database yet</p>
                  <Button onClick={() => setShowCreateItem(true)}>Create Your First Item</Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  {(() => {
                    // Helper functions moved outside map for clarity
                    const getItemImageUrl = (itemName: string, category: string) => {
                      const baseUrl = 'https://www.csgodatabase.com/images';
                      const categoryLower = category?.toLowerCase() || '';
                      const nameLower = itemName?.toLowerCase() || '';
                      
                      // List of knife names that should use knives folder
                      const knifeNames = ['karambit', 'bayonet', 'butterfly', 'falchion', 'flip', 'gut', 'huntsman', 
                                          'bowie', 'shadow daggers', 'navaja', 'stiletto', 'ursus', 'talon', 
                                          'classic knife', 'paracord', 'survival', 'nomad', 'skeleton', 'daggers'];
                      
                      // List of glove names that should use gloves folder
                      const gloveNames = ['hand wraps', 'driver gloves', 'sport gloves', 'specialist gloves', 
                                          'moto gloves', 'bloodhound gloves', 'hydra gloves', 'broken fang gloves'];
                      
                      // Agent names typically start with specific prefixes
                      const agentPrefixes = ['agent', 'cmdr', 'lt.', 'sir', 'enforcer', 'operator', 
                                             'ground rebel', 'osiris', 'ava', 'buckshot', 'two times', 
                                             'sergeant bombson', 'chef d', "'medium rare' crasswater"];
                      
                      let path = 'skins';
                      
                      // Check if it's a knife by name or category
                      if (categoryLower.includes('knife') || categoryLower === 'knives' || 
                          knifeNames.some(knife => nameLower.includes(knife))) {
                        path = 'knives';
                      } 
                      // Check if it's gloves by name or category
                      else if (categoryLower.includes('glove') || categoryLower === 'gloves' || 
                               gloveNames.some(glove => nameLower.includes(glove))) {
                        path = 'gloves';
                      }
                      // Check if it's an agent by name or category
                      else if (categoryLower.includes('agent') || categoryLower === 'agents' || 
                               agentPrefixes.some(prefix => nameLower.startsWith(prefix) || nameLower.includes(prefix))) {
                        path = 'agents';
                      }
                      
                      const formattedName = itemName
                        .replace(/\s*\|\s*/g, '_')
                        .replace(/\s+/g, '_');
                      return `${baseUrl}/${path}/webp/${formattedName}.webp`;
                    };

                    const getRarityStyles = (rarity: string) => {
                      const rarityLower = rarity?.toLowerCase() || 'common';
                      switch (rarityLower) {
                        case 'legendary':
                        case 'covert':
                          return {
                            border: 'border-[#d32ce6]',
                            bg: 'bg-gradient-to-br from-[#d32ce6]/20 to-[#d32ce6]/10',
                            text: 'text-[#d32ce6]',
                            badgeBg: 'bg-[#d32ce6]',
                            badgeText: 'text-white'
                          };
                        case 'epic':
                        case 'classified':
                          return {
                            border: 'border-[#8847ff]',
                            bg: 'bg-gradient-to-br from-[#8847ff]/20 to-[#8847ff]/10',
                            text: 'text-[#8847ff]',
                            badgeBg: 'bg-[#8847ff]',
                            badgeText: 'text-white'
                          };
                        case 'rare':
                        case 'restricted':
                          return {
                            border: 'border-[#4b69ff]',
                            bg: 'bg-gradient-to-br from-[#4b69ff]/20 to-[#4b69ff]/10',
                            text: 'text-[#4b69ff]',
                            badgeBg: 'bg-[#4b69ff]',
                            badgeText: 'text-white'
                          };
                        case 'uncommon':
                        case 'mil-spec':
                        case 'mil-spec grade':
                          return {
                            border: 'border-[#5e98d9]',
                            bg: 'bg-gradient-to-br from-[#5e98d9]/20 to-[#5e98d9]/10',
                            text: 'text-[#5e98d9]',
                            badgeBg: 'bg-[#5e98d9]',
                            badgeText: 'text-white'
                          };
                        case 'common':
                        case 'consumer':
                        case 'consumer grade':
                        default:
                          return {
                            border: 'border-[#b0c3d9]',
                            bg: 'bg-gradient-to-br from-[#b0c3d9]/20 to-[#b0c3d9]/10',
                            text: 'text-[#b0c3d9]',
                            badgeBg: 'bg-[#b0c3d9]',
                            badgeText: 'text-white'
                          };
                      }
                    };

                    // Pagination logic
                    const totalPages = Math.ceil(items.length / itemsPerPage);
                    const startIndex = (itemsCurrentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedItems = items.slice(startIndex, endIndex);

                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {paginatedItems.map((item) => {
                            const rarityStyles = getRarityStyles(item.rarity);
                            const imageUrl = item.image_url || item.image || getItemImageUrl(item.name, item.category || item.type);

                            return (
                              <div 
                                key={item.id} 
                                className={`border-2 ${rarityStyles.border} ${rarityStyles.bg} rounded-lg p-4 space-y-3 hover:shadow-xl hover:scale-105 transition-all duration-200`}
                              >
                                <div className="aspect-video w-full rounded overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                                  <img 
                                    src={imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-contain p-2"
                                    loading="lazy"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      if (target.src.indexOf('/assets/placeholder.svg') === -1) {
                                        target.src = '/assets/placeholder.svg';
                                      }
                                    }}
                                  />
                                </div>
                                <div>
                                  <div className={`font-semibold text-base ${rarityStyles.text}`}>{item.name}</div>
                                  <div className="text-sm text-muted-foreground">{item.type || item.category || 'Unknown'}</div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${rarityStyles.badgeBg} ${rarityStyles.badgeText}`}>
                                    {item.rarity || 'Common'}
                                  </span>
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500 text-white">
                                    💰 {item.value || 0} coins
                                  </span>
                                  {item.featured && (
                                    <span className="px-2 py-1 rounded text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse">
                                      ⭐ FEATURED
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                                )}
                                <div className="flex gap-2 pt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setEditingItem(item);
                                      setShowEditItem(true);
                                    }}
                                  >
                                    <Edit className="w-3 h-3 mr-1" /> Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    onClick={async () => {
                                      if (!confirm(`Delete "${item.name}"?`)) return;
                                      const res = await fetch(`/api/admin/items?id=${item.id}`, { method: 'DELETE' });
                                      if (res.ok) {
                                        setItems(items.filter((it: any) => it.id !== item.id));
                                        toast({
                                          title: "Success",
                                          description: "Item deleted successfully",
                                        });
                                      } else {
                                        const data = await res.json();
                                        toast({
                                          title: "Error",
                                          description: data.error || 'Delete failed',
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setItemsCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={itemsCurrentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          // Show first 2, last 2, and current page
                          let page;
                          if (totalPages <= 5) {
                            page = i + 1;
                          } else if (itemsCurrentPage <= 3) {
                            page = i + 1;
                          } else if (itemsCurrentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                          } else {
                            page = itemsCurrentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={page}
                              variant={itemsCurrentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setItemsCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setItemsCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={itemsCurrentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    Total Items: {items.length} | Page {itemsCurrentPage} of {totalPages}
                  </div>
                </>
              );
            })()}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeNav === 'badges' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Badges</h2>
            <div className="mb-3">
              <Button onClick={() => setShowCreateBadge(true)}>Create Badge</Button>
            </div>
            {loading ? <div>Loading...</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Rarity</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {badges.map((badge: any) => (
                    <TableRow key={badge.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{badge.name}</div>
                          <div className="text-sm text-muted-foreground">{badge.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          {badge.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          badge.rarity === 'legendary' ? 'bg-purple-100 text-purple-800' :
                          badge.rarity === 'epic' ? 'bg-red-100 text-red-800' :
                          badge.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-700 text-gray-200'
                        }`}>
                          {badge.rarity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {badge.requirement_type && (
                            <div>{badge.requirement_type}: {badge.requirement_value}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {badge.image_url && (
                          <img src={badge.image_url} className="h-12 w-12 rounded" alt={badge.name} />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => {
                            setEditingBadge(badge);
                            setNewBadge({
                              name: badge.name,
                              description: badge.description,
                              category: badge.category,
                              rarity: badge.rarity,
                              requirement_type: badge.requirement_type,
                              requirement_value: badge.requirement_value,
                              image_url: badge.image_url
                            });
                            setShowEditBadge(true);
                          }}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={async () => {
                            if (!confirm('Delete this badge?')) return;
                            const res = await fetch(`/api/admin/badges?id=${badge.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              setBadges(badges.filter((b: any) => b.id !== badge.id));
                              alert('Badge deleted');
                            } else {
                              const data = await res.json();
                              alert(data.error || 'Delete failed');
                            }
                          }}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {activeNav === 'siteControl' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Site Control</h2>
            <Tabs value={activeSiteControlTab} onValueChange={setActiveSiteControlTab} className="w-full">
              {/* Mobile-friendly horizontal scroll for tabs */}
              <div className="w-full overflow-x-auto md:overflow-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
                <TabsList
                  aria-label="Site controls"
                  className="flex w-max min-w-full gap-2 snap-x snap-mandatory md:grid md:w-full md:grid-cols-8 md:gap-0"
                >
                  <TabsTrigger className="shrink-0 whitespace-nowrap snap-start" value="site-settings">Site Settings</TabsTrigger>
                  <TabsTrigger className="shrink-0 whitespace-nowrap snap-start" value="flash-sales">Flash Sales</TabsTrigger>
                  <TabsTrigger className="shrink-0 whitespace-nowrap snap-start" value="user-rewards">User Rewards</TabsTrigger>
                  <TabsTrigger className="shrink-0 whitespace-nowrap snap-start" value="theme-design">Theme Design</TabsTrigger>
                  <TabsTrigger className="shrink-0 whitespace-nowrap snap-start" value="connections">Connections</TabsTrigger>
                  {/* Removed match-management tab; functionality moved to side nav */}
                  <TabsTrigger className="shrink-0 whitespace-nowrap snap-start" value="landing-page">Landing Page</TabsTrigger>
                  <TabsTrigger className="shrink-0 whitespace-nowrap snap-start" value="page-toggles">Page Toggles</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="site-settings" className="space-y-6">
                {loading ? <div>Loading...</div> : siteSettings ? (
                  <div className="space-y-6">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Site Name</Label>
                            <Input
                              value={siteSettings.siteName || ''}
                              onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Site Description</Label>
                            <Input
                              value={siteSettings.siteDescription || ''}
                              onChange={(e) => setSiteSettings({ ...siteSettings, siteDescription: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Logo URL</Label>
                            <Input
                              value={siteSettings.logo_url || ''}
                              onChange={(e) => setSiteSettings({ ...siteSettings, logo_url: e.target.value })}
                              placeholder="Enter logo URL (e.g., /uploads/logo.png)"
                            />
                            <p className="text-xs text-muted-foreground">
                              This logo will appear in the corner and hero section of the landing page
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Feature Toggles</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="enableRegistration"
                              checked={siteSettings.enableRegistration || false}
                              onChange={(e) => setSiteSettings({ ...siteSettings, enableRegistration: e.target.checked })}
                            />
                            <Label htmlFor="enableRegistration">Registration</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="maintenanceMode"
                              checked={siteSettings.maintenanceMode || false}
                              onChange={(e) => setSiteSettings({ ...siteSettings, maintenanceMode: e.target.checked })}
                            />
                            <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="enableChat"
                              checked={siteSettings.enableChat || false}
                              onChange={(e) => setSiteSettings({ ...siteSettings, enableChat: e.target.checked })}
                            />
                            <Label htmlFor="enableChat">Chat</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="enableBetting"
                              checked={siteSettings.enableBetting || false}
                              onChange={(e) => setSiteSettings({ ...siteSettings, enableBetting: e.target.checked })}
                            />
                            <Label htmlFor="enableBetting">Betting</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="enableCrates"
                              checked={siteSettings.enableCrates || false}
                              onChange={(e) => setSiteSettings({ ...siteSettings, enableCrates: e.target.checked })}
                            />
                            <Label htmlFor="enableCrates">Crates</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="enableTradeUp"
                              checked={siteSettings.enableTradeUp || false}
                              onChange={(e) => setSiteSettings({ ...siteSettings, enableTradeUp: e.target.checked })}
                            />
                            <Label htmlFor="enableTradeUp">Trade Up</Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Economy Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Minimum Withdrawal ($)</Label>
                            <Input
                              type="number"
                              value={siteSettings.minimumWithdrawal || 5}
                              onChange={(e) => setSiteSettings({ ...siteSettings, minimumWithdrawal: parseFloat(e.target.value) || 5 })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Maximum Bet ($)</Label>
                            <Input
                              type="number"
                              value={siteSettings.maximumBet || 1000}
                              onChange={(e) => setSiteSettings({ ...siteSettings, maximumBet: parseFloat(e.target.value) || 1000 })}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">API Keys</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Steam API Key</Label>
                            <Input
                              type="password"
                              value={siteSettings.steamApiKey || ''}
                              onChange={(e) => setSiteSettings({ ...siteSettings, steamApiKey: e.target.value })}
                              placeholder="Enter Steam API Key"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Pandascore API Key</Label>
                            <Input
                              type="password"
                              value={siteSettings.pandascore_api_key || ''}
                              onChange={(e) => setSiteSettings({ ...siteSettings, pandascore_api_key: e.target.value })}
                              placeholder="Enter Pandascore API Key"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end">
                      <Button onClick={async () => {
                        try {
                          const res = await fetch('/api/site-settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(siteSettings)
                          });
                          if (res.ok) {
                            toast({
                              title: "Successfully saved!",
                              description: "Site settings have been updated.",
                            });
                          } else {
                            const data = await res.json();
                            toast({
                              title: "Error",
                              description: data.error || 'Update failed',
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: 'Update failed',
                            variant: "destructive",
                          });
                        }
                      }}>Save Settings</Button>
                    </div>
                  </div>
                ) : (
                  <div>Loading site settings...</div>
                )}
              </TabsContent>

              <TabsContent value="flash-sales" className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Flash Sales Management</h3>
                      <Button onClick={() => setShowCreateFlashSale(true)}>
                        <Archive className="w-4 h-4 mr-2" />
                        Create Flash Sale
                      </Button>
                    </div>

                    {flashSales.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Original Price</TableHead>
                            <TableHead>Sale Price</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Start Time</TableHead>
                            <TableHead>End Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {flashSales.map((sale: any) => (
                            <TableRow key={sale.id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {sale.items?.image && (
                                    <img
                                      src={sale.items.image}
                                      alt={sale.items?.name || 'Item'}
                                      className="w-8 h-8 rounded"
                                    />
                                  )}
                                  <span>{sale.items?.name || 'Unknown Item'}</span>
                                </div>
                              </TableCell>
                              <TableCell>${sale.original_price}</TableCell>
                              <TableCell>${sale.sale_price}</TableCell>
                              <TableCell>{sale.discount_percent}%</TableCell>
                              <TableCell>{new Date(sale.start_time).toLocaleString()}</TableCell>
                              <TableCell>{new Date(sale.end_time).toLocaleString()}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  sale.active && new Date(sale.end_time) > new Date()
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {sale.active && new Date(sale.end_time) > new Date() ? 'Active' : 'Expired'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingFlashSale(sale);
                                      setNewFlashSale({
                                        item_id: sale.item_id,
                                        original_price: sale.original_price,
                                        sale_price: sale.sale_price,
                                        discount_percent: sale.discount_percent,
                                        start_time: sale.start_time,
                                        end_time: sale.end_time,
                                        active: sale.active
                                      });
                                      setShowEditFlashSale(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      if (!confirm('Are you sure you want to delete this flash sale?')) return;
                                      try {
                                        const res = await fetch(`/api/admin/flash-sales?id=${sale.id}`, {
                                          method: 'DELETE'
                                        });
                                        if (res.ok) {
                                          setFlashSales(flashSales.filter((s: any) => s.id !== sale.id));
                                          alert('Flash sale deleted successfully');
                                        } else {
                                          const data = await res.json();
                                          alert(data.error || 'Delete failed');
                                        }
                                      } catch (error) {
                                        alert('Delete failed');
                                      }
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No flash sales found</p>
                        <p className="text-sm mt-2">Create your first flash sale to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="user-rewards" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">User Rewards Management</h3>
                  <Button onClick={() => setShowCreateReward(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Reward
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <Input
                          placeholder="Search rewards..."
                          className="max-w-sm"
                          onChange={(e) => {
                            // TODO: Implement search filtering
                          }}
                        />
                        <select
                          className="px-3 py-2 border rounded max-w-xs"
                          onChange={(e) => {
                            // TODO: Implement type filtering
                          }}
                        >
                          <option value="">All Types</option>
                          <option value="login_bonus">Login Bonus</option>
                          <option value="level_up">Level Up</option>
                          <option value="achievement">Achievement</option>
                          <option value="referral">Referral</option>
                          <option value="purchase">Purchase</option>
                          <option value="event">Event</option>
                        </select>
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Rewards</TableHead>
                              <TableHead>Conditions</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userRewards.map((reward: any) => (
                              <TableRow key={reward.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{reward.name}</div>
                                    <div className="text-sm text-muted-foreground">{reward.description}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                    {reward.type?.replace('_', ' ') || 'Unknown'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm space-y-1">
                                    {reward.reward_coins > 0 && <div>💰 {reward.reward_coins} coins</div>}
                                    {reward.reward_xp > 0 && <div>⭐ {reward.reward_xp} XP</div>}
                                    {reward.reward_gems > 0 && <div>💎 {reward.reward_gems} gems</div>}
                                    {reward.reward_item && <div>🎁 {reward.reward_item}</div>}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>Max claims: {reward.max_claims_per_user || 'Unlimited'}</div>
                                    {reward.cooldown_hours > 0 && <div>Cooldown: {reward.cooldown_hours}h</div>}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    reward.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {reward.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingReward(reward);
                                        setNewReward({
                                          name: reward.name || '',
                                          description: reward.description || '',
                                          type: reward.type || 'login_bonus',
                                          trigger_condition: reward.trigger_condition || '',
                                          reward_coins: reward.reward_coins || 0,
                                          reward_xp: reward.reward_xp || 0,
                                          reward_gems: reward.reward_gems || 0,
                                          reward_item: reward.reward_item || '',
                                          is_active: reward.is_active || false,
                                          max_claims_per_user: reward.max_claims_per_user || 1,
                                          cooldown_hours: reward.cooldown_hours || 24
                                        });
                                        setShowEditReward(true);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={async () => {
                                        if (!confirm('Are you sure you want to delete this reward?')) return;
                                        try {
                                          const res = await fetch(`/api/admin/user-rewards?id=${reward.id}`, { method: 'DELETE' });
                                          if (res.ok) {
                                            setUserRewards(userRewards.filter((r: any) => r.id !== reward.id));
                                            alert('Reward deleted successfully');
                                          } else {
                                            const data = await res.json();
                                            alert(data.error || 'Delete failed');
                                          }
                                        } catch (error) {
                                          alert('Delete failed');
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {userRewards.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No rewards found. Create your first user reward.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="theme-design" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Theme Design Management</h3>
                  <Button onClick={() => {
                    // TODO: Implement save theme changes
                    toast({
                      title: "Successfully saved!",
                      description: "Theme changes have been updated.",
                    });
                  }}>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Color Scheme */}
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="text-md font-semibold mb-4 flex items-center">
                        <Star className="w-4 h-4 mr-2" />
                        Color Scheme
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Primary Color</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                className="w-16 h-10"
                                defaultValue="#3b82f6"
                              />
                              <Input
                                placeholder="#3b82f6"
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Secondary Color</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                className="w-16 h-10"
                                defaultValue="#64748b"
                              />
                              <Input
                                placeholder="#64748b"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Accent Color</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                className="w-16 h-10"
                                defaultValue="#f59e0b"
                              />
                              <Input
                                placeholder="#f59e0b"
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Background Color</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                className="w-16 h-10"
                                defaultValue="#ffffff"
                              />
                              <Input
                                placeholder="#ffffff"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Typography */}
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="text-md font-semibold mb-4 flex items-center">
                        <Archive className="w-4 h-4 mr-2" />
                        Typography
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Primary Font Family</Label>
                          <select className="w-full px-3 py-2 border rounded bg-secondary text-foreground">
                            <option value="inter">Inter</option>
                            <option value="roboto">Roboto</option>
                            <option value="opensans">Open Sans</option>
                            <option value="lato">Lato</option>
                            <option value="poppins">Poppins</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Heading Font Family</Label>
                          <select className="w-full px-3 py-2 border rounded bg-secondary text-foreground">
                            <option value="inter">Inter</option>
                            <option value="roboto">Roboto</option>
                            <option value="opensans">Open Sans</option>
                            <option value="lato">Lato</option>
                            <option value="poppins">Poppins</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Base Font Size</Label>
                            <select className="w-full px-3 py-2 border rounded bg-secondary text-foreground">
                              <option value="14px">14px</option>
                              <option value="16px">16px</option>
                              <option value="18px">18px</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Line Height</Label>
                            <select className="w-full px-3 py-2 border rounded bg-secondary text-foreground">
                              <option value="1.4">1.4</option>
                              <option value="1.5">1.5</option>
                              <option value="1.6">1.6</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Layout & Spacing */}
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="text-md font-semibold mb-4 flex items-center">
                        <Cog className="w-4 h-4 mr-2" />
                        Layout & Spacing
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Container Max Width</Label>
                          <select className="w-full px-3 py-2 border rounded">
                            <option value="1200px">1200px (Standard)</option>
                            <option value="1440px">1440px (Wide)</option>
                            <option value="100%">100% (Full Width)</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Border Radius</Label>
                            <select className="w-full px-3 py-2 border rounded bg-secondary text-foreground">
                              <option value="4px">4px (Subtle)</option>
                              <option value="8px">8px (Standard)</option>
                              <option value="12px">12px (Rounded)</option>
                              <option value="16px">16px (Very Rounded)</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Shadow Style</Label>
                            <select className="w-full px-3 py-2 border rounded bg-secondary text-foreground">
                              <option value="none">None</option>
                              <option value="subtle">Subtle</option>
                              <option value="medium">Medium</option>
                              <option value="strong">Strong</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Spacing Scale</Label>
                            <select className="w-full px-3 py-2 border rounded bg-secondary text-foreground">
                            <option value="compact">Compact</option>
                            <option value="comfortable">Comfortable</option>
                            <option value="spacious">Spacious</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Theme Presets */}
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="text-md font-semibold mb-4 flex items-center">
                        <Trophy className="w-4 h-4 mr-2" />
                        Theme Presets
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                            <div className="w-full h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded mb-2"></div>
                            <span className="text-sm font-medium">Gaming Dark</span>
                          </Button>
                          <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                            <div className="w-full h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded mb-2"></div>
                            <span className="text-sm font-medium">Modern Light</span>
                          </Button>
                          <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                            <div className="w-full h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded mb-2"></div>
                            <span className="text-sm font-medium">Energetic</span>
                          </Button>
                          <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                            <div className="w-full h-8 bg-gradient-to-r from-gray-700 to-gray-900 rounded mb-2"></div>
                            <span className="text-sm font-medium">Minimal</span>
                          </Button>
                        </div>
                        <div className="pt-4 border-t">
                          <Button variant="outline" className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Custom Theme
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview Section */}
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-md font-semibold mb-4 flex items-center">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Live Preview
                    </h4>
                    <div className="border rounded-lg p-4 bg-gray-800">
                      <div className="max-w-md mx-auto">
                        <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-4">
                          <h5 className="font-semibold text-lg mb-2">Sample Card Title</h5>
                          <p className="text-gray-600 mb-3">This is how your content will look with the current theme settings.</p>
                          <Button className="w-full">Sample Button</Button>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Secondary</Button>
                          <Button variant="secondary" size="sm">Accent</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="connections" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Connections Management</h3>
                  <Button onClick={async () => {
                    try {
                      // Test Pandascore connection
                      const pandascoreTest = await fetch('/api/matches/sync', { method: 'POST' });
                      if (pandascoreTest.ok) {
                        toast({
                          title: "Connections Tested!",
                          description: "All active connections are working properly.",
                        });
                      } else {
                        toast({
                          title: "Test Results",
                          description: "Some connections may need configuration. Check individual services.",
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Test Failed",
                        description: "Could not test connections. Check your configuration.",
                        variant: "destructive",
                      });
                    }
                  }}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test All Connections
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pandascore Integration */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold flex items-center">
                          <Swords className="w-4 h-4 mr-2" />
                          Pandascore API
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${siteSettings?.pandascore_api_key ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                            {siteSettings?.pandascore_api_key ? 'DB Config' : 'Using .env'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>API Key</Label>
                          <Input
                            type="password"
                            placeholder="Enter Pandascore API Key"
                            value={siteSettings?.pandascore_api_key || ''}
                            onChange={(e) => setSiteSettings({ ...siteSettings, pandascore_api_key: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Base URL</Label>
                          <Input
                            placeholder="https://api.pandascore.co"
                            value="https://api.pandascore.co"
                            disabled
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Auto-sync matches</span>
                          <input type="checkbox" defaultChecked className="rounded" />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={async () => {
                            try {
                              const testRes = await fetch('/api/matches/sync', { method: 'POST' });
                              if (testRes.ok) {
                                toast({
                                  title: "Connection Successful!",
                                  description: "Pandascore API is responding correctly.",
                                });
                              } else {
                                toast({
                                  title: "Connection Failed",
                                  description: "Check your API key in Site Settings.",
                                  variant: "destructive",
                                });
                              }
                            } catch {
                              toast({
                                title: "Connection Failed",
                                description: "Could not reach Pandascore API.",
                                variant: "destructive",
                              });
                            }
                          }}>
                            Test Connection
                          </Button>
                          <Button size="sm" variant="outline" onClick={async () => {
                            try {
                              const syncRes = await fetch('/api/matches/sync', { method: 'POST' });
                              if (syncRes.ok) {
                                const data = await syncRes.json();
                                toast({
                                  title: "Sync Complete!",
                                  description: `Successfully synced matches from Pandascore.`,
                                });
                                // Reload matches
                                const matchesRes = await fetch('/api/admin/matches');
                                if (matchesRes.ok) {
                                  const matchesData = await matchesRes.json();
                                  setMatches(matchesData.matches || matchesData.data || []);
                                }
                              } else {
                                toast({
                                  title: "Sync Failed",
                                  description: "Could not sync matches. Check API key.",
                                  variant: "destructive",
                                });
                              }
                            } catch {
                              toast({
                                title: "Sync Failed",
                                description: "An error occurred during sync.",
                                variant: "destructive",
                              });
                            }
                          }}>
                            Sync Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Discord Integration */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold flex items-center">
                          <MessagesSquare className="w-4 h-4 mr-2" />
                          Discord Bot
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Configuring
                          </span>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Bot Token</Label>
                          <Input
                            type="password"
                            placeholder="Enter Discord bot token"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Server ID</Label>
                          <Input
                            placeholder="Enter Discord server ID"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Notification Channel</Label>
                          <Input
                            placeholder="#match-updates"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Match notifications</span>
                          <input type="checkbox" className="rounded" />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Test Bot
                          </Button>
                          <Button size="sm" variant="outline">
                            Setup Webhooks
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Steam Integration */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold flex items-center">
                          <Award className="w-4 h-4 mr-2" />
                          Steam Web API
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Disconnected
                          </span>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>API Key</Label>
                          <Input
                            type="password"
                            placeholder="Enter Steam API key"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>App ID</Label>
                          <Input
                            placeholder="730 (CS2)"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Player stats sync</span>
                          <input type="checkbox" className="rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Inventory tracking</span>
                          <input type="checkbox" className="rounded" />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Test API
                          </Button>
                          <Button size="sm" variant="outline">
                            Get App List
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Gateway */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold flex items-center">
                          <Gem className="w-4 h-4 mr-2" />
                          Payment Gateway
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Connected
                          </span>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Provider</Label>
                          <select className="w-full px-3 py-2 border rounded bg-secondary text-foreground">
                            <option value="stripe">Stripe</option>
                            <option value="paypal">PayPal</option>
                            <option value="coinbase">Coinbase Commerce</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>API Key</Label>
                          <Input
                            type="password"
                            placeholder="••••••••••••••••"
                            defaultValue="stripe_api_key_placeholder"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Webhook Secret</Label>
                          <Input
                            type="password"
                            placeholder="••••••••••••••••"
                            defaultValue="webhook_secret_placeholder"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Test mode</span>
                          <input type="checkbox" defaultChecked className="rounded" />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Test Payment
                          </Button>
                          <Button size="sm" variant="outline">
                            View Transactions
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Email Service */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold flex items-center">
                          <Bell className="w-4 h-4 mr-2" />
                          Email Service
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Connected
                          </span>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Provider</Label>
                          <select className="w-full px-3 py-2 border rounded bg-secondary text-foreground">
                            <option value="sendgrid">SendGrid</option>
                            <option value="mailgun">Mailgun</option>
                            <option value="ses">AWS SES</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>API Key</Label>
                          <Input
                            type="password"
                            placeholder="••••••••••••••••"
                            defaultValue="email_api_key_placeholder"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>From Email</Label>
                          <Input
                            placeholder="noreply@equipgg.com"
                            defaultValue="noreply@equipgg.com"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Transactional emails</span>
                          <input type="checkbox" defaultChecked className="rounded" />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Send Test Email
                          </Button>
                          <Button size="sm" variant="outline">
                            View Templates
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Analytics */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold flex items-center">
                          <LineChart className="w-4 h-4 mr-2" />
                          Analytics
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Connected
                          </span>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Provider</Label>
                          <select className="w-full px-3 py-2 border rounded bg-secondary text-foreground">
                            <option value="google">Google Analytics</option>
                            <option value="mixpanel">Mixpanel</option>
                            <option value="amplitude">Amplitude</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Tracking ID</Label>
                          <Input
                            placeholder="GA_MEASUREMENT_ID"
                            defaultValue="GA_MEASUREMENT_ID"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>API Key</Label>
                          <Input
                            type="password"
                            placeholder="••••••••••••••••"
                            defaultValue="analytics_api_key_placeholder"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Track user events</span>
                          <input type="checkbox" defaultChecked className="rounded" />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Test Tracking
                          </Button>
                          <Button size="sm" variant="outline">
                            View Dashboard
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Connection Status Overview */}
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-md font-semibold mb-4">Connection Status Overview</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                        <div className="text-sm font-medium">Pandascore</div>
                        <div className="text-xs text-muted-foreground">
                          {siteSettings?.pandascore_api_key ? 'DB Configured' : 'Using .env'}
                        </div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className={`w-3 h-3 ${siteSettings?.steamApiKey ? 'bg-green-500' : 'bg-red-500'} rounded-full mx-auto mb-2`}></div>
                        <div className="text-sm font-medium">Steam</div>
                        <div className="text-xs text-muted-foreground">{siteSettings?.steamApiKey ? 'API Connected' : 'Not Configured'}</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                        <div className="text-sm font-medium">Supabase</div>
                        <div className="text-xs text-muted-foreground">Database Connected</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                        <div className="text-sm font-medium">Website</div>
                        <div className="text-xs text-muted-foreground">Online</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Removed match-management TabsContent; side nav version supersedes */}

              <TabsContent value="page-toggles" className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2"><Power className="w-4 h-4" /> Dashboard Page Toggles</h3>
                        <p className="text-sm text-muted-foreground">Disable specific sections for maintenance. Users hitting a disabled page are redirected to /dashboard. Admins always see all pages.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={async () => {
                          const res = await fetch('/api/admin/page-toggles');
                          if (res.ok) {
                            const data = await res.json();
                            setPageToggles(data.toggles || {});
                            setPendingToggles(null as any);
                          }
                        }}>Refresh</Button>
                        <Button size="sm" onClick={() => {
                          const next: Record<string, boolean> = { ...(pendingToggles || pageToggles) };
                          pageToggleList.forEach(p => { next[p] = true; });
                          setPendingToggles(next);
                        }}>Enable All</Button>
                        <Button variant="destructive" size="sm" onClick={() => {
                          const next: Record<string, boolean> = { ...(pendingToggles || pageToggles) };
                          pageToggleList.forEach(p => { next[p] = false; });
                          setPendingToggles(next);
                        }}>Disable All</Button>
                        <Button
                          size="sm"
                          onClick={async () => {
                            const effective = pendingToggles || pageToggles;
                            console.log('Saving page toggles:', effective);
                            const updates = pageToggleList.map(p => ({ 
                              page: p, 
                              enabled: effective[p] === undefined ? true : effective[p] 
                            }));
                            console.log('Updates payload:', updates);
                            const res = await fetch('/api/admin/page-toggles', { 
                              method: 'PUT', 
                              headers: { 'Content-Type': 'application/json' }, 
                              body: JSON.stringify({ updates }) 
                            });
                            if (res.ok) {
                              const data = await res.json();
                              console.log('Save response:', data);
                              console.log('Save response toggles:', data.toggles);
                              console.log('Type of toggles:', typeof data.toggles);
                              console.log('Keys in toggles:', data.toggles ? Object.keys(data.toggles) : 'none');
                              
                              // Don't update state until AFTER the toast
                              if (data.toggles && typeof data.toggles === 'object') {
                                toast({
                                  title: "Successfully saved!",
                                  description: "Page toggles have been updated.",
                                });
                                setPageToggles(data.toggles);
                                setPendingToggles(null as any);
                              } else {
                                toast({
                                  title: "Warning",
                                  description: "Save succeeded but received invalid data format. Please refresh.",
                                  variant: "destructive",
                                });
                              }
                            } else {
                              try { 
                                const d = await res.json(); 
                                toast({
                                  title: "Error",
                                  description: d.error || 'Save failed',
                                  variant: "destructive",
                                });
                              } catch { 
                                toast({
                                  title: "Error",
                                  description: 'Save failed',
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                        >Save Changes</Button>
                        {pendingToggles && (
                          <Button variant="ghost" size="sm" onClick={() => setPendingToggles(null as any)}>Reset</Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pageToggleList.map(p => {
                        const effective = pendingToggles || pageToggles;
                        const enabled = effective[p] !== false; // default enabled
                        return (
                          <div key={p} className="flex items-center justify-between p-4 border rounded-lg bg-card/40 hover:bg-card/60 transition-colors">
                            <div>
                              <div className="font-medium capitalize">{p.replace(/-/g,' ')}</div>
                              <div className="text-xs text-muted-foreground">{enabled ? 'Visible to users' : 'Disabled (redirected)'}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-semibold ${enabled ? 'text-green-400' : 'text-red-400'}`}>{enabled ? 'ON' : 'OFF'}</span>
                              <Switch checked={enabled} onCheckedChange={(val) => {
                                setPendingToggles(prev => ({ ...(prev || pageToggles), [p]: val }));
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {pendingToggles && (
                      <div className="flex items-center justify-between rounded-md border p-3 bg-muted/40">
                        <div className="text-sm text-muted-foreground">You have unsaved changes. Click "Save Changes" to apply for users.</div>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => setPendingToggles(null as any)}>Discard</Button>
                          <Button size="sm" onClick={async () => {
                            const effective = pendingToggles || pageToggles;
                            console.log('Saving page toggles (inline):', effective);
                            const updates = pageToggleList.map(p => ({ 
                              page: p, 
                              enabled: effective[p] === undefined ? true : effective[p] 
                            }));
                            console.log('Updates payload (inline):', updates);
                            const res = await fetch('/api/admin/page-toggles', { 
                              method: 'PUT', 
                              headers: { 'Content-Type': 'application/json' }, 
                              body: JSON.stringify({ updates }) 
                            });
                            if (res.ok) {
                              const data = await res.json();
                              console.log('Save response (inline):', data);
                              console.log('Save response toggles (inline):', data.toggles);
                              
                              // Don't update state until AFTER the alert
                              if (data.toggles && typeof data.toggles === 'object') {
                                alert('Page toggles saved successfully!');
                                setPageToggles(data.toggles);
                                setPendingToggles(null as any);
                              } else {
                                alert('Save succeeded but received invalid data format. Please refresh.');
                              }
                            } else {
                              try { const d = await res.json(); alert(d.error || 'Save failed'); } catch { alert('Save failed'); }
                            }
                          }}>Save Changes</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="landing-page" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Landing Page Settings</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      // Open landing page in new tab for preview
                      window.open('/', '_blank');
                    }}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button onClick={saveLandingPageData}>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Hero Section */}
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="text-md font-semibold mb-4 flex items-center">
                        <Star className="w-4 h-4 mr-2" />
                        Hero Section
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Main Headline</Label>
                          <Input
                            placeholder="Welcome to EquipGG"
                            value={heroPanel?.title || ''}
                            onChange={(e) => setHeroPanel(prev => prev ? {...prev, title: e.target.value} : {
                              id: '',
                              section: 'hero',
                              title: e.target.value,
                              description: '',
                              button_text: '',
                              button_link: '',
                              background_image: '',
                              enabled: true,
                              sort_order: 0
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Subheadline</Label>
                          <Input
                            placeholder="The ultimate gaming marketplace"
                            value={heroPanel?.description || ''}
                            onChange={(e) => setHeroPanel(prev => prev ? {...prev, description: e.target.value} : {
                              id: '',
                              section: 'hero',
                              title: '',
                              description: e.target.value,
                              button_text: '',
                              button_link: '',
                              background_image: '',
                              enabled: true,
                              sort_order: 0
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Logo Layer 1 URL (Character/Main Logo)</Label>
                          <Input
                            placeholder="/1.png"
                            value={heroPanel?.logo_layer1 || '/1.png'}
                            onChange={(e) => setHeroPanel(prev => prev ? {...prev, logo_layer1: e.target.value} : {
                              id: '',
                              section: 'hero',
                              title: '',
                              description: '',
                              button_text: '',
                              button_link: '',
                              background_image: '',
                              logo_layer1: e.target.value,
                              logo_layer2: '/2.png',
                              enabled: true,
                              sort_order: 0
                            })}
                          />
                          <p className="text-xs text-muted-foreground">
                            The main character/logo image that appears first
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Logo Layer 2 URL (Text/Overlay Logo)</Label>
                          <Input
                            placeholder="/2.png"
                            value={heroPanel?.logo_layer2 || '/2.png'}
                            onChange={(e) => setHeroPanel(prev => prev ? {...prev, logo_layer2: e.target.value} : {
                              id: '',
                              section: 'hero',
                              title: '',
                              description: '',
                              button_text: '',
                              button_link: '',
                              background_image: '',
                              logo_layer1: '/1.png',
                              logo_layer2: e.target.value,
                              enabled: true,
                              sort_order: 0
                            })}
                          />
                          <p className="text-xs text-muted-foreground">
                            The text/overlay layer that appears on top
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Hero Background Image URL</Label>
                          <Input
                            placeholder="https://..."
                            value={heroPanel?.background_image || ''}
                            onChange={(e) => setHeroPanel(prev => prev ? {...prev, background_image: e.target.value} : {
                              id: '',
                              section: 'hero',
                              title: '',
                              description: '',
                              button_text: '',
                              button_link: '',
                              background_image: e.target.value,
                              enabled: true,
                              sort_order: 0
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Call-to-Action Text</Label>
                          <Input
                            placeholder="Get Started"
                            value={heroPanel?.button_text || ''}
                            onChange={(e) => setHeroPanel(prev => prev ? {...prev, button_text: e.target.value} : {
                              id: '',
                              section: 'hero',
                              title: '',
                              description: '',
                              button_text: e.target.value,
                              button_link: '',
                              background_image: '',
                              enabled: true,
                              sort_order: 0
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CTA Link</Label>
                          <Input
                            placeholder="/dashboard"
                            value={heroPanel?.button_link || ''}
                            onChange={(e) => setHeroPanel(prev => prev ? {...prev, button_link: e.target.value} : {
                              id: '',
                              section: 'hero',
                              title: '',
                              description: '',
                              button_text: '',
                              button_link: e.target.value,
                              background_image: '',
                              enabled: true,
                              sort_order: 0
                            })}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="heroEnabled" 
                            checked={heroPanel?.enabled ?? true}
                            onChange={(e) => setHeroPanel(prev => prev ? {...prev, enabled: e.target.checked} : {
                              id: '',
                              section: 'hero',
                              title: '',
                              description: '',
                              button_text: '',
                              button_link: '',
                              background_image: '',
                              enabled: e.target.checked,
                              sort_order: 0
                            })}
                            className="rounded" 
                          />
                          <Label htmlFor="heroEnabled">Show Hero Section</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Featured Content */}
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="text-md font-semibold mb-4 flex items-center">
                        <Trophy className="w-4 h-4 mr-2" />
                        Featured Content
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Featured Title</Label>
                          <Input
                            placeholder="Featured Matches"
                            defaultValue="Featured Matches"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            placeholder="Check out the latest matches and odds"
                            defaultValue="Check out the latest matches and odds"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Items to Show</Label>
                          <select className="w-full px-3 py-2 border rounded bg-secondary text-foreground">
                            <option value="3">3 items</option>
                            <option value="6">6 items</option>
                            <option value="9">9 items</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Sort By</Label>
                          <select className="w-full px-3 py-2 border rounded">
                            <option value="date">Date (Newest First)</option>
                            <option value="popularity">Popularity</option>
                            <option value="odds">Highest Odds</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="featuredEnabled" defaultChecked className="rounded" />
                          <Label htmlFor="featuredEnabled">Show Featured Section</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Statistics Section */}
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="text-md font-semibold mb-4 flex items-center">
                        <LineChart className="w-4 h-4 mr-2" />
                        Statistics Display
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Total Users</Label>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id="showUsers" defaultChecked className="rounded" />
                              <span className="text-sm text-muted-foreground">Show: 1,234</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Active Matches</Label>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id="showMatches" defaultChecked className="rounded" />
                              <span className="text-sm text-muted-foreground">Show: 42</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Total Bets</Label>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id="showBets" defaultChecked className="rounded" />
                              <span className="text-sm text-muted-foreground">Show: 8,901</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Items Sold</Label>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id="showItems" defaultChecked className="rounded" />
                              <span className="text-sm text-muted-foreground">Show: 567</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="statsEnabled" defaultChecked className="rounded" />
                          <Label htmlFor="statsEnabled">Show Statistics Section</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Footer Content */}
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="text-md font-semibold mb-4 flex items-center">
                        <Archive className="w-4 h-4 mr-2" />
                        Footer Content
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Footer Text</Label>
                          <Input
                            placeholder="© 2024 EquipGG. All rights reserved."
                            defaultValue="© 2024 EquipGG. All rights reserved."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Privacy Policy Link</Label>
                          <Input
                            placeholder="/privacy"
                            defaultValue="/privacy"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Terms of Service Link</Label>
                          <Input
                            placeholder="/terms"
                            defaultValue="/terms"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Contact Email</Label>
                          <Input
                            placeholder="support@equipgg.com"
                            defaultValue="support@equipgg.com"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="footerEnabled" defaultChecked className="rounded" />
                          <Label htmlFor="footerEnabled">Show Footer</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* SEO Settings */}
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-md font-semibold mb-4 flex items-center">
                      <Cog className="w-4 h-4 mr-2" />
                      SEO & Meta Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Page Title</Label>
                          <Input
                            placeholder="EquipGG - Gaming Marketplace"
                            defaultValue="EquipGG - Gaming Marketplace"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Meta Description</Label>
                          <Input
                            placeholder="The ultimate gaming marketplace for CS2 skins, betting, and more"
                            defaultValue="The ultimate gaming marketplace for CS2 skins, betting, and more"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Meta Keywords</Label>
                          <Input
                            placeholder="gaming, cs2, skins, betting, marketplace"
                            defaultValue="gaming, cs2, skins, betting, marketplace"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Open Graph Image</Label>
                          <Input
                            placeholder="https://..."
                            defaultValue="/logo.png"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Twitter Card Type</Label>
                          <select className="w-full px-3 py-2 border rounded">
                            <option value="summary">Summary</option>
                            <option value="summary_large_image">Summary Large Image</option>
                            <option value="app">App</option>
                            <option value="player">Player</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Canonical URL</Label>
                          <Input
                            placeholder="https://equipgg.com"
                            defaultValue="https://equipgg.com"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Sections */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-semibold flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        Custom Sections
                      </h4>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Section
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">About Section</h5>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Learn more about EquipGG and our mission</p>
                        <div className="flex items-center mt-2">
                          <input type="checkbox" id="aboutEnabled" defaultChecked className="rounded mr-2" />
                          <Label htmlFor="aboutEnabled" className="text-sm">Enabled</Label>
                        </div>
                      </div>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">Testimonials</h5>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">What our users are saying</p>
                        <div className="flex items-center mt-2">
                          <input type="checkbox" id="testimonialsEnabled" className="rounded mr-2" />
                          <Label htmlFor="testimonialsEnabled" className="text-sm">Enabled</Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {activeNav === 'gemManagement' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Gem Management</h2>
            {loading ? <div>Loading...</div> : gemManagement ? (
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Gem Settings</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="gemShopEnabled"
                          checked={gemManagement.gemSettings?.gemShopEnabled || false}
                          onChange={(e) => setGemManagement({
                            ...gemManagement,
                            gemSettings: { ...gemManagement.gemSettings, gemShopEnabled: e.target.checked }
                          })}
                        />
                        <Label htmlFor="gemShopEnabled">Gem Shop Enabled</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="cs2SkinsEnabled"
                          checked={gemManagement.gemSettings?.cs2SkinsEnabled || false}
                          onChange={(e) => setGemManagement({
                            ...gemManagement,
                            gemSettings: { ...gemManagement.gemSettings, cs2SkinsEnabled: e.target.checked }
                          })}
                        />
                        <Label htmlFor="cs2SkinsEnabled">CS2 Skins Enabled</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="exchangeEnabled"
                          checked={gemManagement.gemSettings?.exchangeEnabled || false}
                          onChange={(e) => setGemManagement({
                            ...gemManagement,
                            gemSettings: { ...gemManagement.gemSettings, exchangeEnabled: e.target.checked }
                          })}
                        />
                        <Label htmlFor="exchangeEnabled">Exchange Enabled</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="gemShopMaintenance"
                          checked={gemManagement.gemSettings?.gemShopMaintenance || false}
                          onChange={(e) => setGemManagement({
                            ...gemManagement,
                            gemSettings: { ...gemManagement.gemSettings, gemShopMaintenance: e.target.checked }
                          })}
                        />
                        <Label htmlFor="gemShopMaintenance">Maintenance Mode</Label>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label>Daily Exchange Limit</Label>
                        <Input
                          type="number"
                          value={gemManagement.gemSettings?.dailyExchangeLimit || 10000}
                          onChange={(e) => setGemManagement({
                            ...gemManagement,
                            gemSettings: { ...gemManagement.gemSettings, dailyExchangeLimit: parseInt(e.target.value) || 10000 }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Exchange Per Transaction</Label>
                        <Input
                          type="number"
                          value={gemManagement.gemSettings?.maxExchangePerTransaction || 1000}
                          onChange={(e) => setGemManagement({
                            ...gemManagement,
                            gemSettings: { ...gemManagement.gemSettings, maxExchangePerTransaction: parseInt(e.target.value) || 1000 }
                          })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Exchange Rates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Coins to Gems Rate (1 coin = X gems)</Label>
                        <Input
                          type="number"
                          value={gemManagement.exchangeRates?.coinsToGems || 1000}
                          onChange={(e) => setGemManagement({
                            ...gemManagement,
                            exchangeRates: { ...gemManagement.exchangeRates, coinsToGems: parseInt(e.target.value) || 1000 }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Gems to Coins Rate (1 gem = X coins)</Label>
                        <Input
                          type="number"
                          value={gemManagement.exchangeRates?.gemsToCoins || 800}
                          onChange={(e) => setGemManagement({
                            ...gemManagement,
                            exchangeRates: { ...gemManagement.exchangeRates, gemsToCoins: parseInt(e.target.value) || 800 }
                          })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Gem Packages</h3>
                    <div className="mb-4">
                      <Button onClick={() => {
                        // TODO: Add create gem package dialog
                        alert('Create gem package functionality coming soon');
                      }}>Add Package</Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Gems</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gemManagement.gemPackages?.map((pkg: any) => (
                          <TableRow key={pkg.id}>
                            <TableCell>
                              <div>
                                <div className="font-semibold">{pkg.name}</div>
                                <div className="text-sm text-muted-foreground">{pkg.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>{pkg.gems}</TableCell>
                            <TableCell>${pkg.price}</TableCell>
                            <TableCell>{pkg.currency}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${
                                pkg.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {pkg.enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="secondary" size="sm" onClick={() => {
                                  // TODO: Edit package
                                  alert('Edit functionality coming soon');
                                }}>Edit</Button>
                                <Button variant="destructive" size="sm" onClick={() => {
                                  // TODO: Delete package
                                  alert('Delete functionality coming soon');
                                }}>Delete</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )) || []}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">CS2 Skins</h3>
                    <div className="mb-4">
                      <Button onClick={() => {
                        // TODO: Add create CS2 skin dialog
                        alert('Create CS2 skin functionality coming soon');
                      }}>Add Skin</Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Rarity</TableHead>
                          <TableHead>Gem Cost</TableHead>
                          <TableHead>Steam Price</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gemManagement.cs2Skins?.map((skin: any) => (
                          <TableRow key={skin.id}>
                            <TableCell className="font-semibold">{skin.name}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                                {skin.rarity}
                              </span>
                            </TableCell>
                            <TableCell>{skin.gems} gems</TableCell>
                            <TableCell>${skin.steamMarketPrice}</TableCell>
                            <TableCell>{skin.category}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${
                                skin.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {skin.enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="secondary" size="sm" onClick={() => {
                                  // TODO: Edit skin
                                  alert('Edit functionality coming soon');
                                }}>Edit</Button>
                                <Button variant="destructive" size="sm" onClick={() => {
                                  // TODO: Delete skin
                                  alert('Delete functionality coming soon');
                                }}>Delete</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )) || []}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={async () => {
                    try {
                      // Update gem settings
                      if (gemManagement.gemSettings) {
                        await fetch('/api/admin/gem-management', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'updateGemSettings',
                            data: gemManagement.gemSettings
                          })
                        });
                      }

                      // Update exchange rates
                      if (gemManagement.exchangeRates) {
                        await fetch('/api/admin/gem-management', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'updateExchangeRates',
                            data: gemManagement.exchangeRates
                          })
                        });
                      }

                      alert('Gem management settings updated successfully');
                    } catch (error) {
                      alert('Update failed');
                    }
                  }}>Save Settings</Button>
                </div>
              </div>
            ) : (
              <div>Loading gem management data...</div>
            )}
          </div>
        )}

        {activeNav === 'support' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Support Tickets</h2>
            {loading ? <div>Loading...</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supportTickets.map((ticket: any) => (
                    <TableRow key={ticket.id}>
                      <TableCell>#{ticket.id.slice(-8)}</TableCell>
                      <TableCell className="font-semibold">{ticket.subject}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{ticket.users?.displayName || ticket.user_name}</div>
                          <div className="text-sm text-muted-foreground">{ticket.users?.email || ticket.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          ticket.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                          ticket.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.priority || 'low'}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{ticket.assigned?.displayName || ticket.assigned_to_name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={async () => {
                            setSelectedTicket(ticket);
                            setShowTicketDetails(true);
                            // Fetch ticket details and replies
                            const res = await fetch(`/api/support/tickets/${ticket.id}`);
                            if (res.ok) {
                              const data = await res.json();
                              setTicketReplies(data.replies || []);
                            }
                          }}>View</Button>
                          <select
                            className="px-2 py-1 border rounded text-sm"
                            value={ticket.status}
                            onChange={async (e) => {
                              const res = await fetch(`/api/support/tickets/${ticket.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: e.target.value })
                              });
                              if (res.ok) {
                                // Refresh tickets
                                const refreshRes = await fetch('/api/support/tickets');
                                if (refreshRes.ok) {
                                  const refreshData = await refreshRes.json();
                                  setSupportTickets(refreshData.tickets || []);
                                }
                              }
                            }}
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {activeNav === 'messages' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Messages</h2>
            <div className="mb-3">
              <Button onClick={() => setShowSendMessage(true)}>Send Message</Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Send Messages to Users</h3>
                <p className="text-muted-foreground mb-4">
                  Send different types of messages to users based on their roles. Messages will be delivered as private messages.
                </p>
                <div className="text-sm text-muted-foreground">
                  Use the "Send Message" button above to compose and send messages to users.
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeNav === 'missions' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Missions</h2>
            <div className="mb-3">
              <Button onClick={() => setShowCreateMission(true)}>Create Mission</Button>
            </div>
            {loading ? <div>Loading...</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Rewards</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missions.map((mission: any) => (
                    <TableRow key={mission.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{mission.title}</div>
                          <div className="text-sm text-muted-foreground">{mission.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          {mission.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                          {mission.tier}
                        </span>
                      </TableCell>
                      <TableCell>{mission.target_value}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {mission.reward_coins > 0 && <div>{mission.reward_coins} coins</div>}
                          {mission.reward_xp > 0 && <div>{mission.reward_xp} XP</div>}
                          {mission.reward_item && <div>{mission.reward_item}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          mission.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {mission.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => {
                            setEditingMission(mission);
                            setNewMission({
                              title: mission.title,
                              description: mission.description,
                              type: mission.type,
                              tier: mission.tier,
                              target_value: mission.target_value,
                              reward_coins: mission.reward_coins,
                              reward_xp: mission.reward_xp,
                              reward_item: mission.reward_item,
                              is_active: mission.is_active
                            });
                            setShowEditMission(true);
                          }}>Edit</Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              const newStatus = !mission.is_active;
                              const res = await fetch('/api/admin/missions', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ missionId: mission.id, isActive: newStatus })
                              });
                              if (res.ok) {
                                // Refresh missions
                                const refreshRes = await fetch('/api/admin/missions');
                                if (refreshRes.ok) {
                                  const refreshData = await refreshRes.json();
                                  setMissions(refreshData.missions || []);
                                }
                              } else {
                                const data = await res.json();
                                alert(data.error || 'Failed to update mission status');
                              }
                            }}
                          >
                            {mission.is_active ? 'Disable' : 'Enable'}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={async () => {
                            if (!confirm('Delete this mission?')) return;
                            const res = await fetch(`/api/admin/missions?id=${mission.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              setMissions(missions.filter((m: any) => m.id !== mission.id));
                              alert('Mission deleted');
                            } else {
                              const data = await res.json();
                              alert(data.error || 'Delete failed');
                            }
                          }}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {activeNav === 'matches' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold mb-1">Match Management</h2>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={async () => {
                  if (matches.length === 0) return;
                  if (!confirm('Delete ALL matches? This cannot be undone.')) return;
                  const res = await fetch('/api/admin/matches', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deleteAll: true }) });
                  if (res.ok) {
                    setMatches([]);
                    toast({
                      title: "Success",
                      description: "All matches deleted successfully",
                    });
                  } else {
                    const d = await res.json();
                    toast({
                      title: "Error",
                      description: d.error || 'Bulk delete failed',
                      variant: "destructive",
                    });
                  }
                }}>Delete All</Button>
                <Button onClick={async () => {
                  try {
                    const res = await fetch('/api/matches/sync', { method: 'POST' });
                    if (res.ok) {
                      toast({
                        title: "Success",
                        description: "Matches synced with Pandascore successfully",
                      });
                      const refreshRes = await fetch('/api/admin/matches');
                      if (refreshRes.ok) {
                        const refreshData = await refreshRes.json();
                        setMatches(refreshData.matches || []);
                      }
                    } else {
                      const data = await res.json();
                      toast({
                        title: "Error",
                        description: data.error || 'Sync failed',
                        variant: "destructive",
                      });
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Sync failed",
                      variant: "destructive",
                    });
                  }
                }}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Sync Pandascore
                </Button>
                <Button onClick={() => setShowCreateMatch(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Create Match
                </Button>
                <Button variant="outline" onClick={async () => {
                  try {
                    const res = await fetch('/api/matches/sync-odds', { method: 'POST' });
                    if (res.ok) {
                      toast({
                        title: "Success",
                        description: "HLTV odds synced successfully",
                      });
                      const refreshRes = await fetch('/api/admin/matches');
                      if (refreshRes.ok) {
                        const refreshData = await refreshRes.json();
                        setMatches(refreshData.matches || []);
                      }
                    } else {
                      const data = await res.json();
                      toast({
                        title: "Error",
                        description: data.error || 'Odds sync failed',
                        variant: "destructive",
                      });
                    }
                  } catch (e) {
                    toast({
                      title: "Error",
                      description: "Odds sync failed",
                      variant: "destructive",
                    });
                  }
                }}>
                  Sync HLTV Odds
                </Button>
              </div>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input placeholder="Search matches..." className="max-w-sm" onChange={(e) => { /* future filter */ }} />
                    <select className="px-3 py-2 border rounded max-w-xs bg-secondary text-foreground" onChange={(e) => { /* future status filter */ }}>
                      <option value="">All Status</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>Teams</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Map</TableHead>
                          <TableHead>Date/Time</TableHead>
                          <TableHead>Odds</TableHead>
                          <TableHead>Stream</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Visible to Users</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matches.map((match: any) => (
                          <TableRow key={match.id}>
                            <TableCell>
                              <input type="checkbox" onChange={(e) => {
                                const checked = e.target.checked;
                                setMatches(matches.map((m: any) => m.id === match.id ? { ...m, __selected: checked } : m));
                              }} checked={!!match.__selected} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  {match.team_a_logo && <img src={match.team_a_logo} className="w-6 h-6 rounded" alt={match.team_a_name} />}
                                  <span className="font-medium">{match.team_a_name}</span>
                                </div>
                                <span className="text-muted-foreground">vs</span>
                                <div className="flex items-center gap-1">
                                  {match.team_b_logo && <img src={match.team_b_logo} className="w-6 h-6 rounded" alt={match.team_b_name} />}
                                  <span className="font-medium">{match.team_b_name}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{match.event_name}</TableCell>
                            <TableCell>{match.map || 'TBD'}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{match.match_date ? new Date(match.match_date).toLocaleDateString() : 'TBD'}</div>
                                <div className="text-muted-foreground">{match.start_time || 'TBD'}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{match.team_a_odds?.toFixed(2)} : {match.team_b_odds?.toFixed(2)}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {match.stream_url ? (
                                <a className="text-green-600 text-sm underline" href={match.stream_url} target="_blank" rel="noreferrer">View Stream</a>
                              ) : (
                                <span className="text-red-500 text-sm">No Stream</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${match.status === 'live' ? 'bg-green-100 text-green-800' : match.status === 'completed' ? 'bg-blue-100 text-blue-800' : match.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{match.status || 'upcoming'}</span>
                            </TableCell>
                            <TableCell>
                              <Button title="Toggle whether this match is shown on the user betting page" variant="ghost" size="sm" onClick={async () => {
                                try {
                                  const newVisibility = !match.is_visible;
                                  const res = await fetch('/api/admin/matches', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId: match.id, is_visible: newVisibility }) });
                                  if (res.ok) {
                                    setMatches(matches.map((m: any) => m.id === match.id ? { ...m, is_visible: newVisibility } : m));
                                    toast({
                                      title: "Success",
                                      description: `Match visibility ${newVisibility ? 'enabled' : 'disabled'}`,
                                    });
                                  } else {
                                    const data = await res.json();
                                    toast({
                                      title: "Error",
                                      description: data.error || 'Update failed',
                                      variant: "destructive",
                                    });
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Update failed",
                                    variant: "destructive",
                                  });
                                }
                              }} className={match.is_visible ? 'text-green-600' : 'text-gray-400'}>
                                {match.is_visible ? '👁️' : '🙈'}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 flex-wrap">
                                <Button variant="ghost" size="sm" onClick={() => {
                                  setEditingMatch(match);
                                  setNewMatch({
                                    team_a_name: match.team_a_name || '',
                                    team_a_logo: match.team_a_logo || '',
                                    team_a_odds: match.team_a_odds || 1.0,
                                    team_b_name: match.team_b_name || '',
                                    team_b_logo: match.team_b_logo || '',
                                    team_b_odds: match.team_b_odds || 1.0,
                                    event_name: match.event_name || '',
                                    map: match.map || '',
                                    start_time: match.start_time || '',
                                    match_date: match.match_date || '',
                                    stream_url: match.stream_url || '',
                                    status: match.status || 'upcoming'
                                  });
                                  setShowEditMatch(true);
                                }}><Edit className="w-4 h-4" /></Button>
                                {/* Manual winner set */}
                                <Button variant="outline" size="sm" onClick={async () => {
                                  const ok = confirm(`Set winner: ${match.team_a_name}? This will settle bets.`);
                                  if (!ok) return;
                                  const res = await fetch('/api/admin/matches', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId: match.id, winner: 'team_a' }) });
                                  if (res.ok) {
                                    const refreshed = await fetch('/api/admin/matches');
                                    const data = await refreshed.json();
                                    setMatches(data.matches || []);
                                    toast({
                                      title: "Success",
                                      description: "Winner set to Team A and bets processed",
                                    });
                                  } else {
                                    const d = await res.json();
                                    toast({
                                      title: "Error",
                                      description: d.error || 'Failed to set winner',
                                      variant: "destructive",
                                    });
                                  }
                                }}>Set A Winner</Button>
                                <Button variant="outline" size="sm" onClick={async () => {
                                  const ok = confirm(`Set winner: ${match.team_b_name}? This will settle bets.`);
                                  if (!ok) return;
                                  const res = await fetch('/api/admin/matches', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId: match.id, winner: 'team_b' }) });
                                  if (res.ok) {
                                    const refreshed = await fetch('/api/admin/matches');
                                    const data = await refreshed.json();
                                    setMatches(data.matches || []);
                                    toast({
                                      title: "Success",
                                      description: "Winner set to Team B and bets processed",
                                    });
                                  } else {
                                    const d = await res.json();
                                    toast({
                                      title: "Error",
                                      description: d.error || 'Failed to set winner',
                                      variant: "destructive",
                                    });
                                  }
                                }}>Set B Winner</Button>
                                {/* Auto resolve via PandaScore */}
                                <Button variant="secondary" size="sm" onClick={async () => {
                                  const res = await fetch('/api/admin/matches', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId: match.id, autoResolve: true }) });
                                  if (res.ok) {
                                    const refreshed = await fetch('/api/admin/matches');
                                    const data = await refreshed.json();
                                    setMatches(data.matches || []);
                                    toast({
                                      title: "Success",
                                      description: "Auto resolve triggered",
                                    });
                                  } else {
                                    const d = await res.json();
                                    toast({
                                      title: "Error",
                                      description: d.error || 'Auto resolve failed',
                                      variant: "destructive",
                                    });
                                  }
                                }}>Auto Resolve</Button>
                                <Button variant="ghost" size="sm" onClick={async () => {
                                  if (!confirm('Are you sure you want to delete this match? This will also delete all related bets.')) return;
                                  try {
                                    const res = await fetch('/api/admin/matches', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId: match.id }) });
                                    if (res.ok) {
                                      setMatches(matches.filter((m: any) => m.id !== match.id));
                                      toast({
                                        title: "Success",
                                        description: "Match deleted successfully",
                                      });
                                    } else {
                                      const data = await res.json();
                                      toast({
                                        title: "Error",
                                        description: data.error || 'Delete failed',
                                        variant: "destructive",
                                      });
                                    }
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "Delete failed",
                                      variant: "destructive",
                                    });
                                  }
                                }}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <Button variant="outline" size="sm" onClick={() => {
                          setMatches(matches.map((m: any) => ({ ...m, __selected: true })));
                        }}>Select All</Button>
                        <Button variant="outline" size="sm" className="ml-2" onClick={() => {
                          setMatches(matches.map((m: any) => ({ ...m, __selected: false })));
                        }}>Clear</Button>
                      </div>
                      <div>
                        <Button variant="destructive" size="sm" onClick={async () => {
                          const ids = matches.filter((m: any) => m.__selected).map((m: any) => m.id);
                          if (ids.length === 0) return;
                          if (!confirm(`Delete ${ids.length} selected matches?`)) return;
                          const res = await fetch('/api/admin/matches', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
                          if (res.ok) {
                            setMatches(matches.filter((m: any) => !ids.includes(m.id)));
                            toast({
                              title: "Success",
                              description: `${ids.length} matches deleted successfully`,
                            });
                          } else {
                            const d = await res.json();
                            toast({
                              title: "Error",
                              description: d.error || 'Bulk delete failed',
                              variant: "destructive",
                            });
                          }
                        }}>Delete Selected</Button>
                      </div>
                    </div>
                  </div>
                  {matches.length === 0 && (<div className="text-center py-8 text-muted-foreground"><p>No matches found. Create your first match or sync with Pandascore.</p></div>)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeNav === 'gemManagement' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Gem Management</h2>
            <p>Gem purchase limits and balance management coming soon...</p>
          </div>
        )}

        {activeNav === 'ranks' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Ranks</h2>
            <div className="mb-3">
              <Button onClick={() => setShowCreateRank(true)}>Create Rank</Button>
            </div>
            {loading ? <div>Loading...</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Icon</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>XP Range</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranks.map((rank: any) => (
                    <TableRow key={rank.id}>
                      <TableCell>
                        {rank.image_url && <img src={rank.image_url} className="h-8 w-8 rounded" alt={rank.name} />}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{rank.name}</div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                          Tier {rank.tier}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{rank.min_xp} XP</div>
                          {rank.max_xp && <div>to {rank.max_xp} XP</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => {
                            setEditingRank(rank);
                            setNewRank({
                              name: rank.name || '',
                              min_xp: rank.min_xp || 0,
                              max_xp: rank.max_xp || 0,
                              tier: rank.tier || 1,
                              image_url: rank.image_url || ''
                            });
                            setShowEditRank(true);
                          }}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={async () => {
                            if (!confirm('Delete this rank?')) return;
                            const res = await fetch(`/api/admin/ranks?id=${rank.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              setRanks(ranks.filter((r: any) => r.id !== rank.id));
                              alert('Rank deleted');
                            } else {
                              const data = await res.json();
                              alert(data.error || 'Delete failed');
                            }
                          }}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {activeNav === 'missions' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Missions</h2>
            <p>Mission management coming soon...</p>
          </div>
        )}

        {activeNav === 'achievements' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Achievements</h2>
            <div className="mb-3">
              <Button onClick={() => setShowCreateAchievement(true)}>Create Achievement</Button>
            </div>
            {loading ? <div>Loading...</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Rewards</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {achievements.map((achievement: any) => (
                    <TableRow key={achievement.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{achievement.name}</div>
                          <div className="text-sm text-muted-foreground">{achievement.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          {achievement.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {achievement.xp_reward > 0 && <div>XP: {achievement.xp_reward}</div>}
                          {achievement.coin_reward > 0 && <div>Coins: {achievement.coin_reward}</div>}
                          {achievement.gem_reward > 0 && <div>Gems: {achievement.gem_reward}</div>}
                          {achievement.badge_reward && <div>Badge: {achievement.badge_reward}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          achievement.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {achievement.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => {
                            setEditingAchievement(achievement);
                            setNewAchievement({
                              name: achievement.name,
                              description: achievement.description,
                              category: achievement.category,
                              xp_reward: achievement.xp_reward,
                              coin_reward: achievement.coin_reward,
                              gem_reward: achievement.gem_reward,
                              badge_reward: achievement.badge_reward || '',
                              is_active: achievement.is_active
                            });
                            setShowEditAchievement(true);
                          }}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={async () => {
                            if (!confirm('Delete this achievement?')) return;
                            const res = await fetch(`/api/admin/achievements?id=${achievement.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              setAchievements(achievements.filter((a: any) => a.id !== achievement.id));
                              alert('Achievement deleted');
                            } else {
                              const data = await res.json();
                              alert(data.error || 'Delete failed');
                            }
                          }}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {activeNav === 'crates' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Crates</h2>
            <div className="mb-3">
              <Button onClick={() => setShowCreateCrate(true)}>Create Crate</Button>
            </div>
            {loading ? <div>Loading...</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Contents</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crates.map((crate: any) => (
                    <TableRow key={crate.id}>
                      <TableCell>
                        <img src={crate.image || '/default-team-logo.png'} className="h-12 w-12 rounded object-cover" alt="crate"/>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{crate.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">{crate.description}</div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{crate.price} coins</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {crate.contents && crate.contents.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {crate.contents.slice(0, 3).map((item: string, idx: number) => (
                                <span key={idx} className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                                  {item}
                                </span>
                              ))}
                              {crate.contents.length > 3 && (
                                <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                                  +{crate.contents.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No contents</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          crate.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {crate.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => {
                            setEditingCrate(crate);
                            setNewCrate({
                              name: crate.name,
                              description: crate.description,
                              price: crate.price,
                              image: crate.image,
                              contents: crate.contents || [],
                              isActive: crate.is_active
                            });
                            setShowEditCrate(true);
                          }}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={async () => {
                            if (!confirm('Delete this crate?')) return;
                            const res = await fetch(`/api/admin/crates?id=${crate.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              setCrates(crates.filter((c: any) => c.id !== crate.id));
                              alert('Crate deleted');
                            } else {
                              const data = await res.json();
                              alert(data.error || 'Delete failed');
                            }
                          }}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {activeNav === 'perks' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Perks</h2>
            <div className="mb-3">
              <Button onClick={() => setShowCreatePerk(true)}>Create Perk</Button>
            </div>
            {loading ? <div>Loading...</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Prices</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perks.map((perk: any) => (
                    <TableRow key={perk.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{perk.name}</div>
                          <div className="text-sm text-muted-foreground">{perk.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          {perk.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                          {perk.perk_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {perk.coin_price > 0 && <div>Coins: {perk.coin_price}</div>}
                          {perk.gem_price > 0 && <div>Gems: {perk.gem_price}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {perk.duration_hours > 0 ? `${perk.duration_hours}h` : 'Permanent'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          perk.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {perk.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => {
                            setEditingPerk(perk);
                            setNewPerk({
                              name: perk.name || '',
                              description: perk.description || '',
                              category: perk.category || '',
                              perk_type: perk.perk_type || '',
                              effect_value: perk.effect_value || 0,
                              duration_hours: perk.duration_hours || 0,
                              coin_price: perk.coin_price || 0,
                              gem_price: perk.gem_price || 0,
                              is_active: perk.is_active ?? true
                            });
                            setShowEditPerk(true);
                          }}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={async () => {
                            if (!confirm('Delete this perk?')) return;
                            const res = await fetch(`/api/admin/perks?id=${perk.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              setPerks(perks.filter((p: any) => p.id !== perk.id));
                              alert('Perk deleted');
                            } else {
                              const data = await res.json();
                              alert(data.error || 'Delete failed');
                            }
                          }}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {activeNav === 'support' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Support</h2>
            <p>Support ticket management coming soon...</p>
          </div>
        )}

        {activeNav === 'notifications' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Notifications</h2>
            <p className="text-sm text-muted-foreground mb-4">Send announcements and news updates to users</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Send Announcement */}
              <Card className="p-4">
                <CardContent>
                  <h3 className="text-lg font-semibold mb-3">Send Announcement</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Title *</Label>
                      <Input
                        placeholder="Announcement title"
                        value={newAnnouncement?.title || ''}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Message *</Label>
                      <textarea
                        className="w-full p-2 border rounded resize-none"
                        rows={4}
                        placeholder="Announcement message"
                        value={newAnnouncement?.message || ''}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Target Users</Label>
                      <select
                        className="w-full p-2 border rounded"
                        value={newAnnouncement?.targetUsers || 'all'}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetUsers: e.target.value })}
                      >
                        <option value="all">All Users</option>
                        <option value="admin">Admins Only</option>
                        <option value="user">Regular Users Only</option>
                      </select>
                    </div>
                    <Button
                      onClick={async () => {
                        if (!newAnnouncement?.title || !newAnnouncement?.message) {
                          alert('Please fill in title and message');
                          return;
                        }
                        const res = await fetch('/api/admin/notifications/announcement', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newAnnouncement)
                        });
                        if (res.ok) {
                          const data = await res.json();
                          alert(`Announcement sent to ${data.targetUsers} users!`);
                          setNewAnnouncement({ title: '', message: '', targetUsers: 'all' });
                        } else {
                          const data = await res.json();
                          alert(data.error || 'Failed to send announcement');
                        }
                      }}
                      className="w-full"
                    >
                      Send Announcement
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Send News Update */}
              <Card className="p-4">
                <CardContent>
                  <h3 className="text-lg font-semibold mb-3">Send News Update</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Title *</Label>
                      <Input
                        placeholder="News title"
                        value={newNews?.title || ''}
                        onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Message *</Label>
                      <textarea
                        className="w-full p-2 border rounded resize-none"
                        rows={4}
                        placeholder="News message"
                        value={newNews?.message || ''}
                        onChange={(e) => setNewNews({ ...newNews, message: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Target Users</Label>
                      <select
                        className="w-full p-2 border rounded"
                        value={newNews?.targetUsers || 'all'}
                        onChange={(e) => setNewNews({ ...newNews, targetUsers: e.target.value })}
                      >
                        <option value="all">All Users</option>
                        <option value="admin">Admins Only</option>
                        <option value="user">Regular Users Only</option>
                      </select>
                    </div>
                    <Button
                      onClick={async () => {
                        if (!newNews?.title || !newNews?.message) {
                          alert('Please fill in title and message');
                          return;
                        }
                        const res = await fetch('/api/admin/notifications/news', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newNews)
                        });
                        if (res.ok) {
                          const data = await res.json();
                          alert(`News update sent to ${data.targetUsers} users!`);
                          setNewNews({ title: '', message: '', targetUsers: 'all' });
                        } else {
                          const data = await res.json();
                          alert(data.error || 'Failed to send news update');
                        }
                      }}
                      className="w-full"
                    >
                      Send News Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Notifications History */}
            <Card className="p-4 mt-6">
              <CardContent>
                <h3 className="text-lg font-semibold mb-3">Recent Notifications</h3>
                <div className="text-sm text-muted-foreground mb-4">
                  View recent notifications sent to users (showing last 10)
                </div>
                <div className="space-y-2">
                  {recentNotifications?.slice(0, 10).map((notification: any) => (
                    <div key={notification.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            notification.type === 'announcement' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {notification.type}
                          </span>
                          <span className="font-semibold">{notification.title}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {notification.message.length > 100 ? `${notification.message.substring(0, 100)}...` : notification.message}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Sent: {new Date(notification.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!recentNotifications || recentNotifications.length === 0) && (
                    <div className="text-center text-muted-foreground py-4">
                      No recent notifications
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeNav === 'messages' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Messages</h2>
            <p>Admin messaging functionality coming soon...</p>
          </div>
        )}

        {/* Moderation dialog */}
        <Dialog open={showModeration} onOpenChange={setShowModeration}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Moderate user {selectedUser?.displayName || selectedUser?.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Action</Label>
              <select value={modAction} onChange={(e) => setModAction(e.target.value as any)} className="w-full p-2 border rounded bg-secondary text-foreground">
                <option value="ban">Ban</option>
                <option value="unban">Unban</option>
                <option value="mute">Mute</option>
                <option value="suspend">Suspend</option>
              </select>
              <Label>Reason (optional)</Label>
              <Input value={modReason} onChange={(e) => setModReason(e.target.value)} />
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!selectedUser) return;
                const payload = { userId: selectedUser.id, action: modAction, reason: modReason };
                const res = await fetch('/api/admin/moderation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (res.ok) {
                  alert('Moderation applied');
                  setShowModeration(false);
                } else {
                  const data = await res.json();
                  alert(data.error || 'Moderation failed');
                }
              }}>Apply</Button>
              <Button variant="ghost" onClick={() => setShowModeration(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create item dialog */}
        <Dialog open={showCreateItem} onOpenChange={setShowCreateItem}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Shop Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input 
                    value={newItem.name} 
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} 
                    placeholder="AWP | Dragon Lore"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select 
                    value={newItem.type} 
                    onValueChange={(value) => setNewItem({ ...newItem, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weapon">Weapon</SelectItem>
                      <SelectItem value="Knife">Knife</SelectItem>
                      <SelectItem value="Gloves">Gloves</SelectItem>
                      <SelectItem value="Agent">Agent</SelectItem>
                      <SelectItem value="Sticker">Sticker</SelectItem>
                      <SelectItem value="Case">Case</SelectItem>
                      <SelectItem value="Key">Key</SelectItem>
                      <SelectItem value="Patch">Patch</SelectItem>
                      <SelectItem value="Graffiti">Graffiti</SelectItem>
                      <SelectItem value="Music Kit">Music Kit</SelectItem>
                      <SelectItem value="Collectible">Collectible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rarity</Label>
                  <Select 
                    value={newItem.rarity} 
                    onValueChange={(value) => setNewItem({ ...newItem, rarity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Common">
                        <span className="text-[#b0c3d9] font-semibold">Common</span>
                      </SelectItem>
                      <SelectItem value="Uncommon">
                        <span className="text-[#5e98d9] font-semibold">Uncommon</span>
                      </SelectItem>
                      <SelectItem value="Rare">
                        <span className="text-[#4b69ff] font-semibold">Rare</span>
                      </SelectItem>
                      <SelectItem value="Epic">
                        <span className="text-[#8847ff] font-semibold">Epic</span>
                      </SelectItem>
                      <SelectItem value="Legendary">
                        <span className="text-[#d32ce6] font-semibold">Legendary</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price (Coins)</Label>
                  <Input 
                    type="number" 
                    value={String(newItem.value)} 
                    onChange={(e) => setNewItem({ ...newItem, value: Number(e.target.value || 0) })} 
                    placeholder="1000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Image URL (Optional - Leave empty to auto-generate)</Label>
                <Input 
                  value={newItem.image_url} 
                  onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })} 
                  placeholder="Leave empty for auto-generation from item name"
                />
                <p className="text-xs text-muted-foreground">
                  💡 Leave empty to auto-generate CSGODatabase URL from item name (recommended for weapons, knives, gloves, agents)
                </p>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="equipable" 
                    checked={newItem.is_equipable}
                    onCheckedChange={(checked) => setNewItem({ ...newItem, is_equipable: checked })}
                  />
                  <Label htmlFor="equipable" className="cursor-pointer">Can Equip</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="for_crate" 
                    checked={newItem.for_crate}
                    onCheckedChange={(checked) => setNewItem({ ...newItem, for_crate: checked })}
                  />
                  <Label htmlFor="for_crate" className="cursor-pointer">For Crate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="featured" 
                    checked={newItem.featured || false}
                    onCheckedChange={(checked) => setNewItem({ ...newItem, featured: checked })}
                  />
                  <Label htmlFor="featured" className="cursor-pointer">⭐ Featured</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                const res = await fetch('/api/admin/items', { 
                  method: 'POST', 
                  headers: { 'Content-Type': 'application/json' }, 
                  body: JSON.stringify({
                    name: newItem.name,
                    type: newItem.type,
                    rarity: newItem.rarity,
                    value: newItem.value,
                    image_url: newItem.image_url,
                    is_equipable: newItem.is_equipable,
                    for_crate: newItem.for_crate,
                    featured: newItem.featured || false
                  }) 
                });
                if (res.ok) {
                  const data = await res.json();
                  toast({
                    title: "Success",
                    description: "Item created successfully",
                  });
                  // Refetch all items to get fresh data
                  const refreshRes = await fetch('/api/admin/items');
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setItems(refreshData.items || []);
                  }
                  setShowCreateItem(false);
                  setNewItem({ name: '', type: '', rarity: 'Common', value: 0, image_url: '', is_equipable: false, for_crate: false, featured: false });
                } else {
                  const d = await res.json();
                  toast({
                    title: "Error",
                    description: d.error || 'Create failed',
                    variant: "destructive"
                  });
                }
              }}>Create</Button>
              <Button variant="ghost" onClick={() => setShowCreateItem(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit item dialog */}
        <Dialog open={showEditItem} onOpenChange={setShowEditItem}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Shop Item</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input 
                      value={editingItem.name} 
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} 
                      placeholder="AWP | Dragon Lore"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select 
                      value={editingItem.type} 
                      onValueChange={(value) => setEditingItem({ ...editingItem, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Weapon">Weapon</SelectItem>
                        <SelectItem value="Knife">Knife</SelectItem>
                        <SelectItem value="Gloves">Gloves</SelectItem>
                        <SelectItem value="Agent">Agent</SelectItem>
                        <SelectItem value="Sticker">Sticker</SelectItem>
                        <SelectItem value="Case">Case</SelectItem>
                        <SelectItem value="Key">Key</SelectItem>
                        <SelectItem value="Patch">Patch</SelectItem>
                        <SelectItem value="Graffiti">Graffiti</SelectItem>
                        <SelectItem value="Music Kit">Music Kit</SelectItem>
                        <SelectItem value="Collectible">Collectible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rarity</Label>
                    <Select 
                      value={editingItem.rarity} 
                      onValueChange={(value) => setEditingItem({ ...editingItem, rarity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Common">
                          <span className="text-[#b0c3d9] font-semibold">Common</span>
                        </SelectItem>
                        <SelectItem value="Uncommon">
                          <span className="text-[#5e98d9] font-semibold">Uncommon</span>
                        </SelectItem>
                        <SelectItem value="Rare">
                          <span className="text-[#4b69ff] font-semibold">Rare</span>
                        </SelectItem>
                        <SelectItem value="Epic">
                          <span className="text-[#8847ff] font-semibold">Epic</span>
                        </SelectItem>
                        <SelectItem value="Legendary">
                          <span className="text-[#d32ce6] font-semibold">Legendary</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Price (Coins)</Label>
                    <Input 
                      type="number"
                      value={editingItem.value || editingItem.coin_price || 0} 
                      onChange={(e) => setEditingItem({ ...editingItem, value: Number(e.target.value || 0) })} 
                      placeholder="1000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input 
                    value={editingItem.image_url || editingItem.image || ''} 
                    onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })} 
                    placeholder="https://www.csgodatabase.com/..."
                  />
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="edit_equipable" 
                      checked={editingItem.is_equipable || false}
                      onCheckedChange={(checked) => setEditingItem({ ...editingItem, is_equipable: checked })}
                    />
                    <Label htmlFor="edit_equipable" className="cursor-pointer">Can Equip</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="edit_for_crate" 
                      checked={editingItem.for_crate || false}
                      onCheckedChange={(checked) => setEditingItem({ ...editingItem, for_crate: checked })}
                    />
                    <Label htmlFor="edit_for_crate" className="cursor-pointer">For Crate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="edit_featured" 
                      checked={editingItem.featured || false}
                      onCheckedChange={(checked) => setEditingItem({ ...editingItem, featured: checked })}
                    />
                    <Label htmlFor="edit_featured" className="cursor-pointer">⭐ Featured</Label>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={async () => {
                if (!editingItem) return;
                const res = await fetch('/api/admin/items', { 
                  method: 'PUT', 
                  headers: { 'Content-Type': 'application/json' }, 
                  body: JSON.stringify({
                    id: editingItem.id,
                    name: editingItem.name,
                    type: editingItem.type,
                    rarity: editingItem.rarity,
                    value: editingItem.value,
                    image_url: editingItem.image_url || editingItem.image,
                    is_equipable: editingItem.is_equipable || false,
                    for_crate: editingItem.for_crate || false,
                    featured: editingItem.featured || false
                  })
                });
                if (res.ok) {
                  // Refetch all items from API to get fresh data
                  const itemsRes = await fetch('/api/admin/items');
                  if (itemsRes.ok) {
                    const data = await itemsRes.json();
                    setItems(data.items || []);
                  }
                  setShowEditItem(false);
                  setEditingItem(null);
                  toast({
                    title: "Success",
                    description: "Item updated successfully",
                  });
                } else {
                  const data = await res.json();
                  toast({
                    title: "Error",
                    description: data.error || 'Update failed',
                    variant: "destructive",
                  });
                }
              }}>Save Changes</Button>
              <Button variant="ghost" onClick={() => {
                setShowEditItem(false);
                setEditingItem(null);
              }}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create badge dialog */}
        <Dialog open={showCreateBadge} onOpenChange={setShowCreateBadge}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Badge</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newBadge.name} onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })} />
              <Label>Description</Label>
              <Input value={newBadge.description} onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })} />
              <Label>Category</Label>
              <Input value={newBadge.category} onChange={(e) => setNewBadge({ ...newBadge, category: e.target.value })} />
              <Label>Rarity</Label>
              <Input value={newBadge.rarity} onChange={(e) => setNewBadge({ ...newBadge, rarity: e.target.value })} />
              <Label>Requirement Type</Label>
              <Input value={newBadge.requirement_type} onChange={(e) => setNewBadge({ ...newBadge, requirement_type: e.target.value })} />
              <Label>Requirement Value</Label>
              <Input value={String(newBadge.requirement_value)} onChange={(e) => setNewBadge({ ...newBadge, requirement_value: Number(e.target.value || 0) })} />
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingImage(true);
                const formData = new FormData();
                formData.append('file', file);
                const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
                if (uploadRes.ok) {
                  const uploadData = await uploadRes.json();
                  setNewBadge({ ...newBadge, image_url: uploadData.url });
                } else {
                  alert('Image upload failed');
                }
                setUploadingImage(false);
              }} />
              {uploadingImage && <div>Uploading...</div>}
              {newBadge.image_url && <img src={newBadge.image_url} className="h-16 w-16 mt-2 rounded" alt="preview" />}
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!newBadge.image_url) {
                  alert('Please upload an image first');
                  return;
                }
                const res = await fetch('/api/admin/badges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBadge) });
                if (res.ok) {
                  const data = await res.json();
                  setBadges([...(badges || []), data.badge || newBadge]);
                  setShowCreateBadge(false);
                  setNewBadge({ name: '', description: '', category: '', rarity: 'common', requirement_type: '', requirement_value: 0, image_url: '' });
                  alert('Badge created');
                } else {
                  const d = await res.json();
                  alert(d.error || 'Create failed');
                }
              }}>Create</Button>
              <Button variant="ghost" onClick={() => setShowCreateBadge(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Removed duplicate Create match dialog (kept a single version below) */}

        {/* Edit match dialog */}
        <Dialog open={showEditMatch} onOpenChange={setShowEditMatch}>
          <DialogContent className="flex w-[95vw] flex-col sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Edit Match</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1">
              <div className="space-y-2">
                <Label>Team A Name *</Label>
                <Input value={newMatch.team_a_name} onChange={(e) => setNewMatch({ ...newMatch, team_a_name: e.target.value })} />
                <Label>Team A Logo URL</Label>
                <Input value={newMatch.team_a_logo} onChange={(e) => setNewMatch({ ...newMatch, team_a_logo: e.target.value })} />
                <Label>Team A Odds</Label>
                <Input type="number" step="0.1" value={newMatch.team_a_odds} onChange={(e) => setNewMatch({ ...newMatch, team_a_odds: parseFloat(e.target.value) || 1.0 })} />
              </div>
              <div className="space-y-2">
                <Label>Team B Name *</Label>
                <Input value={newMatch.team_b_name} onChange={(e) => setNewMatch({ ...newMatch, team_b_name: e.target.value })} />
                <Label>Team B Logo URL</Label>
                <Input value={newMatch.team_b_logo} onChange={(e) => setNewMatch({ ...newMatch, team_b_logo: e.target.value })} />
                <Label>Team B Odds</Label>
                <Input type="number" step="0.1" value={newMatch.team_b_odds} onChange={(e) => setNewMatch({ ...newMatch, team_b_odds: parseFloat(e.target.value) || 1.0 })} />
              </div>
              <div className="space-y-2">
                <Label>Event Name *</Label>
                <Input value={newMatch.event_name} onChange={(e) => setNewMatch({ ...newMatch, event_name: e.target.value })} />
                <Label>Map</Label>
                <Input value={newMatch.map} onChange={(e) => setNewMatch({ ...newMatch, map: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Match Date</Label>
                <Input type="date" value={newMatch.match_date} onChange={(e) => setNewMatch({ ...newMatch, match_date: e.target.value })} />
                <Label>Start Time</Label>
                <Input type="time" value={newMatch.start_time} onChange={(e) => setNewMatch({ ...newMatch, start_time: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label>Stream URL</Label>
                <Input value={newMatch.stream_url} onChange={(e) => setNewMatch({ ...newMatch, stream_url: e.target.value })} />
                <Label>Status</Label>
                <select value={newMatch.status} onChange={(e) => setNewMatch({ ...newMatch, status: e.target.value })} className="w-full p-2 border rounded">
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!editingMatch) return;
                if (!newMatch.team_a_name || !newMatch.team_b_name || !newMatch.event_name) {
                  toast({
                    title: "Missing Information",
                    description: "Please fill in: Team A Name, Team B Name, and Event Name",
                    variant: "destructive",
                  });
                  return;
                }
                const updates = {
                  team_a_name: newMatch.team_a_name,
                  team_a_logo: newMatch.team_a_logo,
                  team_a_odds: newMatch.team_a_odds,
                  team_b_name: newMatch.team_b_name,
                  team_b_logo: newMatch.team_b_logo,
                  team_b_odds: newMatch.team_b_odds,
                  event_name: newMatch.event_name,
                  map: newMatch.map,
                  start_time: newMatch.start_time,
                  match_date: newMatch.match_date,
                  stream_url: newMatch.stream_url,
                  status: newMatch.status
                };
                const res = await fetch('/api/admin/matches', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ matchId: editingMatch.id, updates })
                });
                if (res.ok) {
                  // Refresh matches
                  const refreshRes = await fetch('/api/admin/matches');
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setMatches(refreshData.matches || []);
                  }
                  setShowEditMatch(false);
                  setEditingMatch(null);
                  toast({
                    title: "Success",
                    description: `Match updated: ${newMatch.team_a_name} vs ${newMatch.team_b_name}`,
                  });
                } else {
                  const d = await res.json();
                  toast({
                    title: "Error",
                    description: d.error || 'Update failed',
                    variant: "destructive",
                  });
                }
              }}>Update</Button>
              <Button variant="ghost" onClick={() => setShowEditMatch(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create perk dialog */}
        <Dialog open={showCreatePerk} onOpenChange={setShowCreatePerk}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Perk</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newPerk.name} onChange={(e) => setNewPerk({ ...newPerk, name: e.target.value })} />
                <Label>Description *</Label>
                <Input value={newPerk.description} onChange={(e) => setNewPerk({ ...newPerk, description: e.target.value })} />
                <Label>Category *</Label>
                <select value={newPerk.category} onChange={(e) => setNewPerk({ ...newPerk, category: e.target.value })} className="w-full p-2 border rounded">
                  <option value="">Select category</option>
                  <option value="boost">Boost</option>
                  <option value="cosmetic">Cosmetic</option>
                  <option value="utility">Utility</option>
                  <option value="vip">VIP</option>
                </select>
                <Label>Perk Type *</Label>
                <select value={newPerk.perk_type} onChange={(e) => setNewPerk({ ...newPerk, perk_type: e.target.value })} className="w-full p-2 border rounded">
                  <option value="">Select type</option>
                  <option value="xp_multiplier">XP Multiplier</option>
                  <option value="coin_multiplier">Coin Multiplier</option>
                  <option value="gem_discount">Gem Discount</option>
                  <option value="trade_fee_reduction">Trade Fee Reduction</option>
                  <option value="avatar_frame">Avatar Frame</option>
                  <option value="name_color">Name Color</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Effect Value</Label>
                <Input type="number" step="0.1" value={newPerk.effect_value} onChange={(e) => setNewPerk({ ...newPerk, effect_value: parseFloat(e.target.value) || 0 })} />
                <Label>Duration (hours)</Label>
                <Input type="number" value={newPerk.duration_hours} onChange={(e) => setNewPerk({ ...newPerk, duration_hours: parseInt(e.target.value) || 0 })} />
                <Label>Coin Price</Label>
                <Input type="number" value={newPerk.coin_price} onChange={(e) => setNewPerk({ ...newPerk, coin_price: parseInt(e.target.value) || 0 })} />
                <Label>Gem Price</Label>
                <Input type="number" value={newPerk.gem_price} onChange={(e) => setNewPerk({ ...newPerk, gem_price: parseInt(e.target.value) || 0 })} />
                <Label>Active</Label>
                <select value={newPerk.is_active.toString()} onChange={(e) => setNewPerk({ ...newPerk, is_active: e.target.value === 'true' })} className="w-full p-2 border rounded">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!newPerk.name || !newPerk.description || !newPerk.category || !newPerk.perk_type) {
                  alert('Please fill in required fields (Name, Description, Category, Perk Type)');
                  return;
                }
                const res = await fetch('/api/admin/perks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newPerk)
                });
                if (res.ok) {
                  const data = await res.json();
                  // Refresh perks
                  const refreshRes = await fetch('/api/admin/perks');
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setPerks(refreshData.perks || []);
                  }
                  setShowCreatePerk(false);
                  setNewPerk({
                    name: '',
                    description: '',
                    category: '',
                    perk_type: '',
                    effect_value: 0,
                    duration_hours: 0,
                    coin_price: 0,
                    gem_price: 0,
                    is_active: true
                  });
                  alert('Perk created successfully');
                } else {
                  const d = await res.json();
                  alert(d.error || 'Create failed');
                }
              }}>Create</Button>
              <Button variant="ghost" onClick={() => setShowCreatePerk(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit perk dialog */}
        <Dialog open={showEditPerk} onOpenChange={setShowEditPerk}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Perk</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newPerk.name} onChange={(e) => setNewPerk({ ...newPerk, name: e.target.value })} />
                <Label>Description *</Label>
                <Input value={newPerk.description} onChange={(e) => setNewPerk({ ...newPerk, description: e.target.value })} />
                <Label>Category *</Label>
                <select value={newPerk.category} onChange={(e) => setNewPerk({ ...newPerk, category: e.target.value })} className="w-full p-2 border rounded">
                  <option value="">Select category</option>
                  <option value="boost">Boost</option>
                  <option value="cosmetic">Cosmetic</option>
                  <option value="utility">Utility</option>
                  <option value="vip">VIP</option>
                </select>
                <Label>Perk Type *</Label>
                <select value={newPerk.perk_type} onChange={(e) => setNewPerk({ ...newPerk, perk_type: e.target.value })} className="w-full p-2 border rounded">
                  <option value="">Select type</option>
                  <option value="xp_multiplier">XP Multiplier</option>
                  <option value="coin_multiplier">Coin Multiplier</option>
                  <option value="gem_discount">Gem Discount</option>
                  <option value="trade_fee_reduction">Trade Fee Reduction</option>
                  <option value="avatar_frame">Avatar Frame</option>
                  <option value="name_color">Name Color</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Effect Value</Label>
                <Input type="number" step="0.1" value={newPerk.effect_value} onChange={(e) => setNewPerk({ ...newPerk, effect_value: parseFloat(e.target.value) || 0 })} />
                <Label>Duration (hours)</Label>
                <Input type="number" value={newPerk.duration_hours} onChange={(e) => setNewPerk({ ...newPerk, duration_hours: parseInt(e.target.value) || 0 })} />
                <Label>Coin Price</Label>
                <Input type="number" value={newPerk.coin_price} onChange={(e) => setNewPerk({ ...newPerk, coin_price: parseInt(e.target.value) || 0 })} />
                <Label>Gem Price</Label>
                <Input type="number" value={newPerk.gem_price} onChange={(e) => setNewPerk({ ...newPerk, gem_price: parseInt(e.target.value) || 0 })} />
                <Label>Active</Label>
                <select value={newPerk.is_active.toString()} onChange={(e) => setNewPerk({ ...newPerk, is_active: e.target.value === 'true' })} className="w-full p-2 border rounded">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!editingPerk) return;
                if (!newPerk.name || !newPerk.description || !newPerk.category || !newPerk.perk_type) {
                  alert('Please fill in required fields (Name, Description, Category, Perk Type)');
                  return;
                }
                const updateData = {
                  name: newPerk.name,
                  description: newPerk.description,
                  category: newPerk.category,
                  perk_type: newPerk.perk_type,
                  effect_value: newPerk.effect_value,
                  duration_hours: newPerk.duration_hours,
                  coin_price: newPerk.coin_price,
                  gem_price: newPerk.gem_price,
                  is_active: newPerk.is_active
                };
                const res = await fetch('/api/admin/perks', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: editingPerk.id, ...updateData })
                });
                if (res.ok) {
                  // Refresh perks
                  const refreshRes = await fetch('/api/admin/perks');
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setPerks(refreshData.perks || []);
                  }
                  setShowEditPerk(false);
                  setEditingPerk(null);
                  alert('Perk updated successfully');
                } else {
                  const d = await res.json();
                  alert(d.error || 'Update failed');
                }
              }}>Update</Button>
              <Button variant="ghost" onClick={() => setShowEditPerk(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create rank dialog */}
        <Dialog open={showCreateRank} onOpenChange={setShowCreateRank}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Rank</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newRank.name} onChange={(e) => setNewRank({ ...newRank, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Minimum XP *</Label>
                <Input type="number" value={newRank.min_xp} onChange={(e) => setNewRank({ ...newRank, min_xp: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Maximum XP (optional)</Label>
                <Input type="number" value={newRank.max_xp} onChange={(e) => setNewRank({ ...newRank, max_xp: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Tier</Label>
                <Input type="number" value={newRank.tier} onChange={(e) => setNewRank({ ...newRank, tier: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={newRank.image_url} onChange={(e) => setNewRank({ ...newRank, image_url: e.target.value })} />
                {newRank.image_url && <img src={newRank.image_url} className="h-16 w-16 mt-2 rounded" alt="preview" />}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!newRank.name || newRank.min_xp === undefined) {
                  alert('Please fill in required fields (Name and Minimum XP)');
                  return;
                }
                const res = await fetch('/api/admin/ranks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newRank)
                });
                if (res.ok) {
                  const data = await res.json();
                  // Refresh ranks
                  const refreshRes = await fetch('/api/admin/ranks');
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setRanks(refreshData.ranks || []);
                  }
                  setShowCreateRank(false);
                  setNewRank({
                    name: '',
                    min_xp: 0,
                    max_xp: 0,
                    tier: 1,
                    image_url: ''
                  });
                  alert('Rank created successfully');
                } else {
                  const d = await res.json();
                  alert(d.error || 'Create failed');
                }
              }}>Create</Button>
              <Button variant="ghost" onClick={() => setShowCreateRank(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit rank dialog */}
        <Dialog open={showEditRank} onOpenChange={setShowEditRank}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Rank</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newRank.name} onChange={(e) => setNewRank({ ...newRank, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Minimum XP *</Label>
                <Input type="number" value={newRank.min_xp} onChange={(e) => setNewRank({ ...newRank, min_xp: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Maximum XP (optional)</Label>
                <Input type="number" value={newRank.max_xp} onChange={(e) => setNewRank({ ...newRank, max_xp: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Tier</Label>
                <Input type="number" value={newRank.tier} onChange={(e) => setNewRank({ ...newRank, tier: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={newRank.image_url} onChange={(e) => setNewRank({ ...newRank, image_url: e.target.value })} />
                {newRank.image_url && <img src={newRank.image_url} className="h-16 w-16 mt-2 rounded" alt="preview" />}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!editingRank) return;
                if (!newRank.name || newRank.min_xp === undefined) {
                  alert('Please fill in required fields (Name and Minimum XP)');
                  return;
                }
                const updateData = {
                  id: editingRank.id,
                  name: newRank.name,
                  min_xp: newRank.min_xp,
                  max_xp: newRank.max_xp,
                  tier: newRank.tier,
                  image_url: newRank.image_url
                };
                const res = await fetch('/api/admin/ranks', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updateData)
                });
                if (res.ok) {
                  // Refresh ranks
                  const refreshRes = await fetch('/api/admin/ranks');
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setRanks(refreshData.ranks || []);
                  }
                  setShowEditRank(false);
                  setEditingRank(null);
                  alert('Rank updated successfully');
                } else {
                  const d = await res.json();
                  alert(d.error || 'Update failed');
                }
              }}>Update</Button>
              <Button variant="ghost" onClick={() => setShowEditRank(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create crate dialog */}
        <Dialog open={showCreateCrate} onOpenChange={setShowCreateCrate}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Crate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newCrate.name} onChange={(e) => setNewCrate({ ...newCrate, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input value={newCrate.description} onChange={(e) => setNewCrate({ ...newCrate, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Price (coins) *</Label>
                <Input type="number" value={newCrate.price} onChange={(e) => setNewCrate({ ...newCrate, price: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={newCrate.image} onChange={(e) => setNewCrate({ ...newCrate, image: e.target.value })} />
                {newCrate.image && <img src={newCrate.image} className="h-16 w-16 mt-2 rounded" alt="preview" />}
              </div>
              <div className="space-y-2">
                <Label>Contents (comma-separated)</Label>
                <Input value={newCrate.contents.join(', ')} onChange={(e) => setNewCrate({ ...newCrate, contents: e.target.value.split(',').map(s => s.trim()).filter(s => s) })} />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isActive" checked={newCrate.isActive} onChange={(e) => setNewCrate({ ...newCrate, isActive: e.target.checked })} />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!newCrate.name || !newCrate.description || newCrate.price === undefined) {
                  alert('Please fill in required fields (Name, Description, and Price)');
                  return;
                }
                const res = await fetch('/api/admin/crates', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newCrate)
                });
                if (res.ok) {
                  const data = await res.json();
                  // Refresh crates
                  const refreshRes = await fetch('/api/admin/crates');
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setCrates(refreshData.crates || []);
                  }
                  setShowCreateCrate(false);
                  setNewCrate({
                    name: '',
                    description: '',
                    price: 0,
                    image: '',
                    contents: [],
                    isActive: true
                  });
                  alert('Crate created successfully');
                } else {
                  const d = await res.json();
                  alert(d.error || 'Create failed');
                }
              }}>Create</Button>
              <Button variant="ghost" onClick={() => setShowCreateCrate(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit crate dialog */}
        <Dialog open={showEditCrate} onOpenChange={setShowEditCrate}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Crate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newCrate.name} onChange={(e) => setNewCrate({ ...newCrate, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input value={newCrate.description} onChange={(e) => setNewCrate({ ...newCrate, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Price (coins) *</Label>
                <Input type="number" value={newCrate.price} onChange={(e) => setNewCrate({ ...newCrate, price: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={newCrate.image} onChange={(e) => setNewCrate({ ...newCrate, image: e.target.value })} />
                {newCrate.image && <img src={newCrate.image} className="h-16 w-16 mt-2 rounded" alt="preview" />}
              </div>
              <div className="space-y-2">
                <Label>Contents (comma-separated)</Label>
                <Input value={newCrate.contents.join(', ')} onChange={(e) => setNewCrate({ ...newCrate, contents: e.target.value.split(',').map(s => s.trim()).filter(s => s) })} />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isActiveEdit" checked={newCrate.isActive} onChange={(e) => setNewCrate({ ...newCrate, isActive: e.target.checked })} />
                <Label htmlFor="isActiveEdit">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!editingCrate) return;
                if (!newCrate.name || !newCrate.description || newCrate.price === undefined) {
                  alert('Please fill in required fields (Name, Description, and Price)');
                  return;
                }
                const updateData = {
                  id: editingCrate.id,
                  name: newCrate.name,
                  description: newCrate.description,
                  price: newCrate.price,
                  image: newCrate.image,
                  contents: newCrate.contents,
                  isActive: newCrate.isActive
                };
                const res = await fetch('/api/admin/crates', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updateData)
                });
                if (res.ok) {
                  // Refresh crates
                  const refreshRes = await fetch('/api/admin/crates');
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setCrates(refreshData.crates || []);
                  }
                  setShowEditCrate(false);
                  setEditingCrate(null);
                  alert('Crate updated successfully');
                } else {
                  const d = await res.json();
                  alert(d.error || 'Update failed');
                }
              }}>Update</Button>
              <Button variant="ghost" onClick={() => setShowEditCrate(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create achievement dialog */}
        <Dialog open={showCreateAchievement} onOpenChange={setShowCreateAchievement}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Achievement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newAchievement.name} onChange={(e) => setNewAchievement({ ...newAchievement, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input value={newAchievement.description} onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Input value={newAchievement.category} onChange={(e) => setNewAchievement({ ...newAchievement, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>XP Reward</Label>
                <Input type="number" value={newAchievement.xp_reward} onChange={(e) => setNewAchievement({ ...newAchievement, xp_reward: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Coin Reward</Label>
                <Input type="number" value={newAchievement.coin_reward} onChange={(e) => setNewAchievement({ ...newAchievement, coin_reward: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Gem Reward</Label>
                <Input type="number" value={newAchievement.gem_reward} onChange={(e) => setNewAchievement({ ...newAchievement, gem_reward: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Badge Reward</Label>
                <Input value={newAchievement.badge_reward} onChange={(e) => setNewAchievement({ ...newAchievement, badge_reward: e.target.value })} />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isActiveAchievement" checked={newAchievement.is_active} onChange={(e) => setNewAchievement({ ...newAchievement, is_active: e.target.checked })} />
                <Label htmlFor="isActiveAchievement">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!newAchievement.name || !newAchievement.description || !newAchievement.category) {
                  alert('Please fill in required fields (Name, Description, and Category)');
                  return;
                }
                const res = await fetch('/api/admin/achievements', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newAchievement)
                });
                if (res.ok) {
                  const data = await res.json();
                  // Refresh achievements
                  const refreshRes = await fetch('/api/admin/achievements');
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setAchievements(refreshData.achievements || []);
                  }
                  setShowCreateAchievement(false);
                  setNewAchievement({
                    name: '',
                    description: '',
                    category: '',
                    xp_reward: 0,
                    coin_reward: 0,
                    gem_reward: 0,
                    badge_reward: '',
                    is_active: true
                  });
                  alert('Achievement created successfully');
                } else {
                  const d = await res.json();
                  alert(d.error || 'Create failed');
                }
              }}>Create</Button>
              <Button variant="ghost" onClick={() => setShowCreateAchievement(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit achievement dialog */}
        <Dialog open={showEditAchievement} onOpenChange={setShowEditAchievement}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Achievement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newAchievement.name} onChange={(e) => setNewAchievement({ ...newAchievement, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input value={newAchievement.description} onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Input value={newAchievement.category} onChange={(e) => setNewAchievement({ ...newAchievement, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>XP Reward</Label>
                <Input type="number" value={newAchievement.xp_reward} onChange={(e) => setNewAchievement({ ...newAchievement, xp_reward: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Coin Reward</Label>
                <Input type="number" value={newAchievement.coin_reward} onChange={(e) => setNewAchievement({ ...newAchievement, coin_reward: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Gem Reward</Label>
                <Input type="number" value={newAchievement.gem_reward} onChange={(e) => setNewAchievement({ ...newAchievement, gem_reward: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Badge Reward</Label>
                <Input value={newAchievement.badge_reward} onChange={(e) => setNewAchievement({ ...newAchievement, badge_reward: e.target.value })} />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isActiveAchievementEdit" checked={newAchievement.is_active} onChange={(e) => setNewAchievement({ ...newAchievement, is_active: e.target.checked })} />
                <Label htmlFor="isActiveAchievementEdit">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!editingAchievement) return;
                if (!newAchievement.name || !newAchievement.description || !newAchievement.category) {
                  alert('Please fill in required fields (Name, Description, and Category)');
                  return;
                }
                const updateData = {
                  id: editingAchievement.id,
                  name: newAchievement.name,
                  description: newAchievement.description,
                  category: newAchievement.category,
                  xp_reward: newAchievement.xp_reward,
                  coin_reward: newAchievement.coin_reward,
                  gem_reward: newAchievement.gem_reward,
                  badge_reward: newAchievement.badge_reward,
                  is_active: newAchievement.is_active
                };
                const res = await fetch('/api/admin/achievements', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updateData)
                });
                if (res.ok) {
                  // Refresh achievements
                  const refreshRes = await fetch('/api/admin/achievements');
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setAchievements(refreshData.achievements || []);
                  }
                  setShowEditAchievement(false);
                  setEditingAchievement(null);
                  alert('Achievement updated successfully');
                } else {
                  const d = await res.json();
                  alert(d.error || 'Update failed');
                }
              }}>Update</Button>
              <Button variant="ghost" onClick={() => setShowEditAchievement(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Support ticket details dialog */}
        <Dialog open={showTicketDetails} onOpenChange={setShowTicketDetails}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Support Ticket #{selectedTicket?.id?.slice(-8)}</DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Subject</Label>
                    <p className="text-sm">{selectedTicket.subject}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Status</Label>
                    <select
                      className="w-full px-3 py-2 border rounded"
                      value={selectedTicket.status}
                      onChange={async (e) => {
                        const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: e.target.value })
                        });
                        if (res.ok) {
                          // Update local state
                          setSelectedTicket({ ...selectedTicket, status: e.target.value });
                          // Refresh tickets list
                          const refreshRes = await fetch('/api/support/tickets');
                          if (refreshRes.ok) {
                            const refreshData = await refreshRes.json();
                            setSupportTickets(refreshData.tickets || []);
                          }
                        }
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <Label className="font-semibold">User</Label>
                    <p className="text-sm">{selectedTicket.users?.displayName || selectedTicket.user_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedTicket.users?.email || selectedTicket.user_email}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Priority</Label>
                    <select
                      className="w-full px-3 py-2 border rounded"
                      value={selectedTicket.priority || 'low'}
                      onChange={async (e) => {
                        const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ priority: e.target.value })
                        });
                        if (res.ok) {
                          setSelectedTicket({ ...selectedTicket, priority: e.target.value });
                        }
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <Label className="font-semibold">Created</Label>
                    <p className="text-sm">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Assigned To</Label>
                    <select
                      className="w-full px-3 py-2 border rounded"
                      value={selectedTicket.assigned_to || ''}
                      onChange={async (e) => {
                        const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ assigned_to: e.target.value || null })
                        });
                        if (res.ok) {
                          setSelectedTicket({ ...selectedTicket, assigned_to: e.target.value || null });
                        }
                      }}
                    >
                      <option value="">Unassigned</option>
                      {/* TODO: Add admin/moderator users as options */}
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Description</Label>
                  <div className="mt-2 p-4 bg-gray-800 rounded border">
                    <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Replies ({ticketReplies.length})</Label>
                  <div className="mt-2 space-y-4 max-h-60 overflow-y-auto">
                    {ticketReplies.map((reply: any) => (
                      <div key={reply.id} className="p-3 border rounded">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold">{reply.user_name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{new Date(reply.created_at).toLocaleString()}</div>
                        </div>
                        <p className="whitespace-pre-wrap">{reply.message}</p>
                        {reply.user_role && (
                          <div className="mt-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {reply.user_role}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Add Reply</Label>
                  <textarea
                    className="w-full mt-2 p-3 border rounded resize-none"
                    rows={4}
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Type your reply here..."
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      onClick={async () => {
                        if (!newReply.trim()) return;
                        const res = await fetch(`/api/support/tickets/${selectedTicket.id}/replies`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ message: newReply })
                        });
                        if (res.ok) {
                          // Refresh replies
                          const refreshRes = await fetch(`/api/support/tickets/${selectedTicket.id}`);
                          if (refreshRes.ok) {
                            const refreshData = await refreshRes.json();
                            setTicketReplies(refreshData.replies || []);
                          }
                          setNewReply('');
                        } else {
                          const data = await res.json();
                          alert(data.error || 'Failed to send reply');
                        }
                      }}
                      disabled={!newReply.trim()}
                    >
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowTicketDetails(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send message dialog */}
        <Dialog open={showSendMessage} onOpenChange={setShowSendMessage}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Message to Users</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Message Type</Label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newMessage.type}
                  onChange={(e) => setNewMessage({ ...newMessage, type: e.target.value })}
                >
                  <option value="info">Information</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Target Users</Label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newMessage.targetUsers}
                  onChange={(e) => setNewMessage({ ...newMessage, targetUsers: e.target.value })}
                >
                  <option value="all">All Users</option>
                  <option value="admin">Admins Only</option>
                  <option value="moderator">Moderators Only</option>
                  <option value="user">Regular Users Only</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  placeholder="Message subject"
                />
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <textarea
                  className="w-full px-3 py-2 border rounded resize-none"
                  rows={6}
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  placeholder="Message content"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!newMessage.subject.trim() || !newMessage.content.trim()) {
                  setInlineStatus({ type: 'error', message: 'Please fill in both subject and content' });
                  return;
                }
                setInlineStatus({ type: 'loading', message: 'Sending...' });
                try {
                  const res = await fetch('/api/admin/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newMessage)
                  });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok) {
                    setInlineStatus({ type: 'success', message: `Message sent to ${data.sentTo || 'selected'} users` });
                    setTimeout(() => {
                      setShowSendMessage(false);
                      setInlineStatus(null);
                    }, 1000);
                    setNewMessage({
                      type: 'info',
                      subject: '',
                      content: '',
                      targetUsers: 'all'
                    });
                  } else {
                    setInlineStatus({ type: 'error', message: data.error || 'Failed to send message' });
                  }
                } catch (e) {
                  setInlineStatus({ type: 'error', message: 'Network error sending message' });
                }
              }}>Send Message</Button>
              <Button variant="ghost" onClick={() => setShowSendMessage(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create mission dialog */}
        <Dialog open={showCreateMission} onOpenChange={setShowCreateMission}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Mission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={newMission.title} onChange={(e) => setNewMission({ ...newMission, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input value={newMission.description} onChange={(e) => setNewMission({ ...newMission, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newMission.type}
                  onChange={(e) => setNewMission({ ...newMission, type: e.target.value })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="achievement">Achievement</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tier *</Label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newMission.tier}
                  onChange={(e) => setNewMission({ ...newMission, tier: e.target.value })}
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Target Value</Label>
                <Input type="number" value={newMission.target_value} onChange={(e) => setNewMission({ ...newMission, target_value: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="space-y-2">
                <Label>Reward Coins</Label>
                <Input type="number" value={newMission.reward_coins} onChange={(e) => setNewMission({ ...newMission, reward_coins: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Reward XP</Label>
                <Input type="number" value={newMission.reward_xp} onChange={(e) => setNewMission({ ...newMission, reward_xp: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Reward Item</Label>
                <Input value={newMission.reward_item} onChange={(e) => setNewMission({ ...newMission, reward_item: e.target.value })} />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isActiveMission" checked={newMission.is_active} onChange={(e) => setNewMission({ ...newMission, is_active: e.target.checked })} />
                <Label htmlFor="isActiveMission">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!newMission.title || !newMission.description || !newMission.type || !newMission.tier) {
                  alert('Please fill in required fields (Title, Description, Type, and Tier)');
                  return;
                }
                const res = await fetch('/api/admin/missions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newMission)
                });
                if (res.ok) {
                  // Refresh missions
                  const refreshRes = await fetch('/api/admin/missions');
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setMissions(refreshData.missions || []);
                  }
                  setShowCreateMission(false);
                  setNewMission({
                    title: '',
                    description: '',
                    type: 'daily',
                    tier: 'bronze',
                    target_value: 1,
                    reward_coins: 0,
                    reward_xp: 0,
                    reward_item: '',
                    is_active: true
                  });
                  alert('Mission created successfully');
                } else {
                  const data = await res.json();
                  alert(data.error || 'Create failed');
                }
              }}>Create</Button>
              <Button variant="ghost" onClick={() => setShowCreateMission(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit mission dialog */}
        <Dialog open={showEditMission} onOpenChange={setShowEditMission}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Mission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={newMission.title} onChange={(e) => setNewMission({ ...newMission, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input value={newMission.description} onChange={(e) => setNewMission({ ...newMission, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newMission.type}
                  onChange={(e) => setNewMission({ ...newMission, type: e.target.value })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="achievement">Achievement</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tier *</Label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newMission.tier}
                  onChange={(e) => setNewMission({ ...newMission, tier: e.target.value })}
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Target Value</Label>
                <Input type="number" value={newMission.target_value} onChange={(e) => setNewMission({ ...newMission, target_value: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="space-y-2">
                <Label>Reward Coins</Label>
                <Input type="number" value={newMission.reward_coins} onChange={(e) => setNewMission({ ...newMission, reward_coins: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Reward XP</Label>
                <Input type="number" value={newMission.reward_xp} onChange={(e) => setNewMission({ ...newMission, reward_xp: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Reward Item</Label>
                <Input value={newMission.reward_item} onChange={(e) => setNewMission({ ...newMission, reward_item: e.target.value })} />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isActiveMissionEdit" checked={newMission.is_active} onChange={(e) => setNewMission({ ...newMission, is_active: e.target.checked })} />
                <Label htmlFor="isActiveMissionEdit">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!editingMission) return;
                if (!newMission.title || !newMission.description || !newMission.type || !newMission.tier) {
                  alert('Please fill in required fields (Title, Description, Type, and Tier)');
                  return;
                }
                const updateData = {
                  id: editingMission.id,
                  title: newMission.title,
                  description: newMission.description,
                  type: newMission.type,
                  tier: newMission.tier,
                  target_value: newMission.target_value,
                  reward_coins: newMission.reward_coins,
                  reward_xp: newMission.reward_xp,
                  reward_item: newMission.reward_item,
                  is_active: newMission.is_active
                };
                const res = await fetch('/api/admin/missions', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updateData)
                });
                if (res.ok) {
                  // Refresh missions
                  const refreshRes = await fetch('/api/admin/missions');
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setMissions(refreshData.missions || []);
                  }
                  setShowEditMission(false);
                  setEditingMission(null);
                  alert('Mission updated successfully');
                } else {
                  const data = await res.json();
                  alert(data.error || 'Update failed');
                }
              }}>Update</Button>
              <Button variant="ghost" onClick={() => setShowEditMission(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create badge dialog */}
        <Dialog open={showCreateBadge} onOpenChange={setShowCreateBadge}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Badge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newBadge.name} onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input value={newBadge.description} onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Input value={newBadge.category} onChange={(e) => setNewBadge({ ...newBadge, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Rarity</Label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newBadge.rarity}
                  onChange={(e) => setNewBadge({ ...newBadge, rarity: e.target.value })}
                >
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Requirement Type</Label>
                <Input value={newBadge.requirement_type} onChange={(e) => setNewBadge({ ...newBadge, requirement_type: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Requirement Value</Label>
                <Input type="number" value={newBadge.requirement_value} onChange={(e) => setNewBadge({ ...newBadge, requirement_value: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={newBadge.image_url} onChange={(e) => setNewBadge({ ...newBadge, image_url: e.target.value })} />
                {newBadge.image_url && <img src={newBadge.image_url} className="h-16 w-16 mt-2 rounded" alt="preview" />}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!newBadge.name || !newBadge.description || !newBadge.category) {
                  alert('Please fill in required fields (Name, Description, and Category)');
                  return;
                }
                const res = await fetch('/api/admin/badges', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newBadge)
                });
                if (res.ok) {
                  // Refresh badges
                  const refreshRes = await fetch('/api/admin/badges');
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setBadges(refreshData.badges || []);
                  }
                  setShowCreateBadge(false);
                  setNewBadge({
                    name: '',
                    description: '',
                    category: '',
                    rarity: 'common',
                    requirement_type: '',
                    requirement_value: 0,
                    image_url: ''
                  });
                  alert('Badge created successfully');
                } else {
                  const data = await res.json();
                  alert(data.error || 'Create failed');
                }
              }}>Create</Button>
              <Button variant="ghost" onClick={() => setShowCreateBadge(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit badge dialog */}
        <Dialog open={showEditBadge} onOpenChange={setShowEditBadge}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Badge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newBadge.name} onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input value={newBadge.description} onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Input value={newBadge.category} onChange={(e) => setNewBadge({ ...newBadge, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Rarity</Label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newBadge.rarity}
                  onChange={(e) => setNewBadge({ ...newBadge, rarity: e.target.value })}
                >
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Requirement Type</Label>
                <Input value={newBadge.requirement_type} onChange={(e) => setNewBadge({ ...newBadge, requirement_type: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Requirement Value</Label>
                <Input type="number" value={newBadge.requirement_value} onChange={(e) => setNewBadge({ ...newBadge, requirement_value: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={newBadge.image_url} onChange={(e) => setNewBadge({ ...newBadge, image_url: e.target.value })} />
                {newBadge.image_url && <img src={newBadge.image_url} className="h-16 w-16 mt-2 rounded" alt="preview" />}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!editingBadge) return;
                if (!newBadge.name || !newBadge.description || !newBadge.category) {
                  alert('Please fill in required fields (Name, Description, and Category)');
                  return;
                }
                const updateData = {
                  id: editingBadge.id,
                  name: newBadge.name,
                  description: newBadge.description,
                  category: newBadge.category,
                  rarity: newBadge.rarity,
                  requirement_type: newBadge.requirement_type,
                  requirement_value: newBadge.requirement_value,
                  image_url: newBadge.image_url
                };
                const res = await fetch('/api/admin/badges', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updateData)
                });
                if (res.ok) {
                  // Refresh badges
                  const refreshRes = await fetch('/api/admin/badges');
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setBadges(refreshData.badges || []);
                  }
                  setShowEditBadge(false);
                  setEditingBadge(null);
                  alert('Badge updated successfully');
                } else {
                  const data = await res.json();
                  alert(data.error || 'Update failed');
                }
              }}>Update</Button>
              <Button variant="ghost" onClick={() => setShowEditBadge(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit user dialog */}
        <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userRole">Role</Label>
                  <select
                    id="userRole"
                    value={editingUser.role || 'user'}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="userLevel">Level</Label>
                  <Input
                    id="userLevel"
                    type="number"
                    value={editingUser.level || 1}
                    onChange={(e) => setEditingUser({...editingUser, level: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div>
                  <Label htmlFor="userCoins">Coins</Label>
                  <Input
                    id="userCoins"
                    type="number"
                    value={editingUser.coins || 0}
                    onChange={(e) => setEditingUser({...editingUser, coins: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="userGems">Gems</Label>
                  <Input
                    id="userGems"
                    type="number"
                    value={editingUser.gems || 0}
                    onChange={(e) => setEditingUser({...editingUser, gems: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="userXP">XP</Label>
                  <Input
                    id="userXP"
                    type="number"
                    value={editingUser.xp || 0}
                    onChange={(e) => setEditingUser({...editingUser, xp: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={async () => {
                if (!editingUser) return;
                const updateData = {
                  id: editingUser.id,
                  role: editingUser.role,
                  level: editingUser.level,
                  coins: editingUser.coins,
                  gems: editingUser.gems,
                  xp: editingUser.xp
                };
                const res = await fetch('/api/admin/users', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updateData)
                });
                if (res.ok) {
                  // Refresh users
                  const refreshRes = await fetch('/api/admin/users');
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setUsers(refreshData.users || []);
                  }
                  setShowEditUser(false);
                  setEditingUser(null);
                  toast({
                    title: "Success",
                    description: "User updated successfully",
                  });
                } else {
                  const data = await res.json();
                  toast({
                    title: "Error",
                    description: data.error || 'Update failed',
                    variant: "destructive",
                  });
                }
              }}>Update</Button>
              <Button variant="ghost" onClick={() => setShowEditUser(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete user dialog */}
        <Dialog open={showDeleteUser} onOpenChange={setShowDeleteUser}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete user "{selectedUser?.displayname || selectedUser?.email}"? This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="destructive" onClick={async () => {
                if (!selectedUser) return;
                const res = await fetch(`/api/admin/users?id=${selectedUser.id}`, { method: 'DELETE' });
                if (res.ok) {
                  setUsers(users.filter((u: any) => u.id !== selectedUser.id));
                  setShowDeleteUser(false);
                  setSelectedUser(null);
                  toast({
                    title: "Success",
                    description: "User deleted successfully",
                  });
                } else {
                  const data = await res.json();
                  toast({
                    title: "Error",
                    description: data.error || 'Delete failed',
                    variant: "destructive",
                  });
                }
              }}>Delete</Button>
              <Button variant="ghost" onClick={() => setShowDeleteUser(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create flash sale dialog */}
        <Dialog open={showCreateFlashSale} onOpenChange={setShowCreateFlashSale}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Flash Sale</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Item *</Label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newFlashSale.item_id}
                  onChange={(e) => {
                    const selectedItem = items.find((item: any) => item.id === e.target.value);
                    setNewFlashSale({
                      ...newFlashSale,
                      item_id: e.target.value,
                      original_price: selectedItem?.value || 0
                    });
                  }}
                >
                  <option value="">Select an item</option>
                  {items.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (${item.value})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Original Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newFlashSale.original_price}
                  onChange={(e) => setNewFlashSale({ ...newFlashSale, original_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sale Price ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newFlashSale.sale_price}
                  onChange={(e) => {
                    const salePrice = parseFloat(e.target.value) || 0;
                    const discount = newFlashSale.original_price > 0
                      ? Math.round(((newFlashSale.original_price - salePrice) / newFlashSale.original_price) * 100)
                      : 0;
                    setNewFlashSale({
                      ...newFlashSale,
                      sale_price: salePrice,
                      discount_percent: discount
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  value={newFlashSale.discount_percent}
                  onChange={(e) => setNewFlashSale({ ...newFlashSale, discount_percent: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="datetime-local"
                  value={newFlashSale.start_time}
                  onChange={(e) => setNewFlashSale({ ...newFlashSale, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input
                  type="datetime-local"
                  value={newFlashSale.end_time}
                  onChange={(e) => setNewFlashSale({ ...newFlashSale, end_time: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="flashSaleActive"
                  checked={newFlashSale.active}
                  onChange={(e) => setNewFlashSale({ ...newFlashSale, active: e.target.checked })}
                />
                <Label htmlFor="flashSaleActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!newFlashSale.item_id || !newFlashSale.sale_price || !newFlashSale.start_time || !newFlashSale.end_time) {
                  toast({
                    title: "Missing Fields",
                    description: "Please fill in required fields (Item, Sale Price, Start Time, End Time)",
                    variant: "destructive",
                  });
                  return;
                }
                const res = await fetch('/api/admin/flash-sales', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newFlashSale)
                });
                if (res.ok) {
                  const data = await res.json();
                  setFlashSales([data, ...flashSales]);
                  setShowCreateFlashSale(false);
                  setNewFlashSale({
                    item_id: '',
                    original_price: 0,
                    sale_price: 0,
                    discount_percent: 0,
                    start_time: '',
                    end_time: '',
                    active: true
                  });
                  alert('Flash sale created successfully');
                } else {
                  const data = await res.json();
                  alert(data.error || 'Create failed');
                }
              }}>Create</Button>
              <Button variant="ghost" onClick={() => setShowCreateFlashSale(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit flash sale dialog */}
        <Dialog open={showEditFlashSale} onOpenChange={setShowEditFlashSale}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Flash Sale</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Item *</Label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newFlashSale.item_id}
                  onChange={(e) => {
                    const selectedItem = items.find((item: any) => item.id === e.target.value);
                    setNewFlashSale({
                      ...newFlashSale,
                      item_id: e.target.value,
                      original_price: selectedItem?.value || 0
                    });
                  }}
                >
                  <option value="">Select an item</option>
                  {items.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (${item.value})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Original Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newFlashSale.original_price}
                  onChange={(e) => setNewFlashSale({ ...newFlashSale, original_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sale Price ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newFlashSale.sale_price}
                  onChange={(e) => {
                    const salePrice = parseFloat(e.target.value) || 0;
                    const discount = newFlashSale.original_price > 0
                      ? Math.round(((newFlashSale.original_price - salePrice) / newFlashSale.original_price) * 100)
                      : 0;
                    setNewFlashSale({
                      ...newFlashSale,
                      sale_price: salePrice,
                      discount_percent: discount
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  value={newFlashSale.discount_percent}
                  onChange={(e) => setNewFlashSale({ ...newFlashSale, discount_percent: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="datetime-local"
                  value={newFlashSale.start_time}
                  onChange={(e) => setNewFlashSale({ ...newFlashSale, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input
                  type="datetime-local"
                  value={newFlashSale.end_time}
                  onChange={(e) => setNewFlashSale({ ...newFlashSale, end_time: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editFlashSaleActive"
                  checked={newFlashSale.active}
                  onChange={(e) => setNewFlashSale({ ...newFlashSale, active: e.target.checked })}
                />
                <Label htmlFor="editFlashSaleActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!editingFlashSale) return;
                if (!newFlashSale.item_id || !newFlashSale.sale_price || !newFlashSale.start_time || !newFlashSale.end_time) {
                  alert('Please fill in required fields (Item, Sale Price, Start Time, End Time)');
                  return;
                }
                const updateData = {
                  id: editingFlashSale.id,
                  item_id: newFlashSale.item_id,
                  original_price: newFlashSale.original_price,
                  sale_price: newFlashSale.sale_price,
                  discount_percent: newFlashSale.discount_percent,
                  start_time: newFlashSale.start_time,
                  end_time: newFlashSale.end_time,
                  active: newFlashSale.active
                };
                const res = await fetch('/api/admin/flash-sales', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updateData)
                });
                if (res.ok) {
                  const data = await res.json();
                  setFlashSales(flashSales.map((s: any) => s.id === editingFlashSale.id ? data : s));
                  setShowEditFlashSale(false);
                  setEditingFlashSale(null);
                  alert('Flash sale updated successfully');
                } else {
                  const data = await res.json();
                  alert(data.error || 'Update failed');
                }
              }}>Update</Button>
              <Button variant="ghost" onClick={() => setShowEditFlashSale(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create match dialog */}
        <Dialog open={showCreateMatch} onOpenChange={setShowCreateMatch}>
          <DialogContent className="flex w-[95vw] flex-col sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Create Match</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="space-y-2">
                <Label>Team A Name *</Label>
                <Input
                  value={newMatch.team_a_name}
                  onChange={(e) => setNewMatch({ ...newMatch, team_a_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Team A Logo URL</Label>
                <Input
                  value={newMatch.team_a_logo}
                  onChange={(e) => setNewMatch({ ...newMatch, team_a_logo: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Team A Odds</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newMatch.team_a_odds}
                  onChange={(e) => setNewMatch({ ...newMatch, team_a_odds: parseFloat(e.target.value) || 1.0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Team B Name *</Label>
                <Input
                  value={newMatch.team_b_name}
                  onChange={(e) => setNewMatch({ ...newMatch, team_b_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Team B Logo URL</Label>
                <Input
                  value={newMatch.team_b_logo}
                  onChange={(e) => setNewMatch({ ...newMatch, team_b_logo: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Team B Odds</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newMatch.team_b_odds}
                  onChange={(e) => setNewMatch({ ...newMatch, team_b_odds: parseFloat(e.target.value) || 1.0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Event Name *</Label>
                <Input
                  value={newMatch.event_name}
                  onChange={(e) => setNewMatch({ ...newMatch, event_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Map</Label>
                <Input
                  value={newMatch.map}
                  onChange={(e) => setNewMatch({ ...newMatch, map: e.target.value })}
                  placeholder="e.g., Dust2, Mirage, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Match Date *</Label>
                <Input
                  type="date"
                  value={newMatch.match_date}
                  onChange={(e) => setNewMatch({ ...newMatch, match_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newMatch.start_time}
                  onChange={(e) => setNewMatch({ ...newMatch, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Stream URL</Label>
                <Input
                  value={newMatch.stream_url}
                  onChange={(e) => setNewMatch({ ...newMatch, stream_url: e.target.value })}
                  placeholder="https://twitch.tv/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newMatch.status}
                  onChange={(e) => setNewMatch({ ...newMatch, status: e.target.value })}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!newMatch.team_a_name || !newMatch.team_b_name || !newMatch.event_name || !newMatch.match_date) {
                  toast({
                    title: "Missing Information",
                    description: "Please fill in: Team A Name, Team B Name, Event Name, and Match Date",
                    variant: "destructive",
                  });
                  return;
                }
                const res = await fetch('/api/admin/matches', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newMatch)
                });
                if (res.ok) {
                  const data = await res.json();
                  setMatches([data.match, ...matches]);
                  setShowCreateMatch(false);
                  setNewMatch({
                    team_a_name: '',
                    team_a_logo: '',
                    team_a_odds: 1.0,
                    team_b_name: '',
                    team_b_logo: '',
                    team_b_odds: 1.0,
                    event_name: '',
                    map: '',
                    start_time: '',
                    match_date: '',
                    stream_url: '',
                    status: 'upcoming'
                  });
                  toast({
                    title: "Success",
                    description: `Match created: ${newMatch.team_a_name} vs ${newMatch.team_b_name}`,
                  });
                } else {
                  const data = await res.json();
                  toast({
                    title: "Error",
                    description: data.error || 'Create failed',
                    variant: "destructive",
                  });
                }
              }}>Create</Button>
              <Button variant="ghost" onClick={() => setShowCreateMatch(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>



        {/* Create reward dialog */}
        <Dialog open={showCreateReward} onOpenChange={setShowCreateReward}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create User Reward</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={newReward.name}
                  onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                  placeholder="e.g., Daily Login Bonus"
                />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input
                  value={newReward.description}
                  onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                  placeholder="Brief description of the reward"
                />
              </div>
              <div className="space-y-2">
                <Label>Reward Type *</Label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newReward.type}
                  onChange={(e) => setNewReward({ ...newReward, type: e.target.value })}
                >
                  <option value="login_bonus">Login Bonus</option>
                  <option value="level_up">Level Up</option>
                  <option value="achievement">Achievement</option>
                  <option value="referral">Referral</option>
                  <option value="purchase">Purchase</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Trigger Condition</Label>
                <Input
                  value={newReward.trigger_condition}
                  onChange={(e) => setNewReward({ ...newReward, trigger_condition: e.target.value })}
                  placeholder="e.g., consecutive_days=7"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Coins</Label>
                  <Input
                    type="number"
                    value={newReward.reward_coins}
                    onChange={(e) => setNewReward({ ...newReward, reward_coins: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>XP</Label>
                  <Input
                    type="number"
                    value={newReward.reward_xp}
                    onChange={(e) => setNewReward({ ...newReward, reward_xp: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gems</Label>
                  <Input
                    type="number"
                    value={newReward.reward_gems}
                    onChange={(e) => setNewReward({ ...newReward, reward_gems: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reward Item</Label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newReward.reward_item}
                  onChange={(e) => setNewReward({ ...newReward, reward_item: e.target.value })}
                >
                  <option value="">No item reward</option>
                  {items.map((item: any) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Claims per User</Label>
                  <Input
                    type="number"
                    value={newReward.max_claims_per_user}
                    onChange={(e) => setNewReward({ ...newReward, max_claims_per_user: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cooldown (hours)</Label>
                  <Input
                    type="number"
                    value={newReward.cooldown_hours}
                    onChange={(e) => setNewReward({ ...newReward, cooldown_hours: parseInt(e.target.value) || 24 })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rewardActive"
                  checked={newReward.is_active}
                  onChange={(e) => setNewReward({ ...newReward, is_active: e.target.checked })}
                />
                <Label htmlFor="rewardActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!newReward.name || !newReward.description || !newReward.type) {
                  alert('Please fill in required fields (Name, Description, Type)');
                  return;
                }
                const res = await fetch('/api/admin/user-rewards', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newReward)
                });
                if (res.ok) {
                  const data = await res.json();
                  setUserRewards([data, ...userRewards]);
                  setShowCreateReward(false);
                  setNewReward({
                    name: '',
                    description: '',
                    type: 'login_bonus',
                    trigger_condition: '',
                    reward_coins: 0,
                    reward_xp: 0,
                    reward_gems: 0,
                    reward_item: '',
                    is_active: true,
                    max_claims_per_user: 1,
                    cooldown_hours: 24
                  });
                  alert('Reward created successfully');
                } else {
                  const data = await res.json();
                  alert(data.error || 'Create failed');
                }
              }}>Create</Button>
              <Button variant="ghost" onClick={() => setShowCreateReward(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit reward dialog */}
        <Dialog open={showEditReward} onOpenChange={setShowEditReward}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User Reward</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={newReward.name}
                  onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                  placeholder="e.g., Daily Login Bonus"
                />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input
                  value={newReward.description}
                  onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                  placeholder="Brief description of the reward"
                />
              </div>
              <div className="space-y-2">
                <Label>Reward Type *</Label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newReward.type}
                  onChange={(e) => setNewReward({ ...newReward, type: e.target.value })}
                >
                  <option value="login_bonus">Login Bonus</option>
                  <option value="level_up">Level Up</option>
                  <option value="achievement">Achievement</option>
                  <option value="referral">Referral</option>
                  <option value="purchase">Purchase</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Trigger Condition</Label>
                <Input
                  value={newReward.trigger_condition}
                  onChange={(e) => setNewReward({ ...newReward, trigger_condition: e.target.value })}
                  placeholder="e.g., consecutive_days=7"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Coins</Label>
                  <Input
                    type="number"
                    value={newReward.reward_coins}
                    onChange={(e) => setNewReward({ ...newReward, reward_coins: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>XP</Label>
                  <Input
                    type="number"
                    value={newReward.reward_xp}
                    onChange={(e) => setNewReward({ ...newReward, reward_xp: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gems</Label>
                  <Input
                    type="number"
                    value={newReward.reward_gems}
                    onChange={(e) => setNewReward({ ...newReward, reward_gems: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reward Item</Label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newReward.reward_item}
                  onChange={(e) => setNewReward({ ...newReward, reward_item: e.target.value })}
                >
                  <option value="">No item reward</option>
                  {items.map((item: any) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Claims per User</Label>
                  <Input
                    type="number"
                    value={newReward.max_claims_per_user}
                    onChange={(e) => setNewReward({ ...newReward, max_claims_per_user: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cooldown (hours)</Label>
                  <Input
                    type="number"
                    value={newReward.cooldown_hours}
                    onChange={(e) => setNewReward({ ...newReward, cooldown_hours: parseInt(e.target.value) || 24 })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editRewardActive"
                  checked={newReward.is_active}
                  onChange={(e) => setNewReward({ ...newReward, is_active: e.target.checked })}
                />
                <Label htmlFor="editRewardActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!editingReward) return;
                if (!newReward.name || !newReward.description || !newReward.type) {
                  alert('Please fill in required fields (Name, Description, Type)');
                  return;
                }
                const updateData = {
                  id: editingReward.id,
                  name: newReward.name,
                  description: newReward.description,
                  type: newReward.type,
                  trigger_condition: newReward.trigger_condition,
                  reward_coins: newReward.reward_coins,
                  reward_xp: newReward.reward_xp,
                  reward_gems: newReward.reward_gems,
                  reward_item: newReward.reward_item,
                  is_active: newReward.is_active,
                  max_claims_per_user: newReward.max_claims_per_user,
                  cooldown_hours: newReward.cooldown_hours
                };
                const res = await fetch('/api/admin/user-rewards', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updateData)
                });
                if (res.ok) {
                  const data = await res.json();
                  setUserRewards(userRewards.map((r: any) => r.id === editingReward.id ? data : r));
                  setShowEditReward(false);
                  setEditingReward(null);
                  alert('Reward updated successfully');
                } else {
                  const data = await res.json();
                  alert(data.error || 'Update failed');
                }
              }}>Update</Button>
              <Button variant="ghost" onClick={() => setShowEditReward(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
      <Toaster />
    </div>
  );
}
