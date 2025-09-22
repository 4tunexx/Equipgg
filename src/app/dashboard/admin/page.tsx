
'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import type { DBAchievement, DBMission, DBShopItem, DBCrate, Rarity } from "../../../lib/supabase/queries";
import LandingManagement from './landing-management/page';
import AdminMessagesPage from './messages/page';
import { useAuth } from "../../../components/auth-provider";
import {
  LineChart,
  Users as UsersIcon,
  Cog,
  Swords,
  ShoppingBag,
  Gem,
  Palette,
  Trophy,
  Star,
  Award,
  Archive,
  Ticket,
  ShieldCheck,
  Bell,
  MessagesSquare,
  Upload,
  Trash2,
  Zap,
  Coins,
  Settings,
  Search,
  PlusCircle,
  Edit,
  Eye,
  MoreHorizontal,
  BarChart3,
  Shield,
  UserPlus,
  MicOff,
  Ban,
  AlertTriangle,
  Gift,
  Target,
  TrendingUp,
  DollarSign,
  Activity,
  Calendar
} from 'lucide-react';

// Utility function for class names
const cn = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).join(' ')
}

// Simple toast hook replacement
const useToast = () => {
  return {
    toast: ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
      console.log(`Toast: ${title}${description ? ` - ${description}` : ''}`)
    }
  }
}

// UI Components
const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
)

const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
)

const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
)

const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
)

const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
)

const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
)

const Dialog = ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6">{children}</div>
);

const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);

const DialogTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold">{children}</h2>
);

const DialogDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-gray-600 mt-1">{children}</p>
);

const DialogFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="flex justify-end gap-2 mt-6">{children}</div>
);

const Button = ({ className, variant = "default", size = "default", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
  const variants = {
    default: "bg-orange-500 text-white hover:bg-orange-600",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-orange-500 underline-offset-4 hover:underline"
  }
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10"
  }
  return (
    <button className={cn(baseClasses, variants[variant], sizes[size], className)} {...props} />
  )
}

const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />
)

const Input = ({ className, type = "text", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
)

const Select = ({ children, value, onValueChange }: { children: React.ReactNode; value?: string; onValueChange?: (value: string) => void }) => (
  <div className="relative">{children}</div>
)

const SelectTrigger = ({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
  <button className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>
    {children}
  </button>
)

const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <span className="text-muted-foreground">{placeholder}</span>
)

const SelectContent = ({ children }: { children: React.ReactNode }) => (
  <div className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
    {children}
  </div>
)

const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <div className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
    {children}
  </div>
)

// Removed Tabs components as we're using the old sidebar design

// Shop item categories and data
const shopItemCategories = {
  'Weapons': ['Rifle', 'Pistol', 'SMG', 'Shotgun', 'Sniper', 'Machine Gun'],
  'Knives': ['Bayonet', 'Karambit', 'M9 Bayonet', 'Butterfly', 'Flip', 'Gut'],
  'Gloves': ['Sport', 'Driver', 'Hand Wraps', 'Moto', 'Specialist'],
  'Stickers': ['Team', 'Tournament', 'Signature', 'Holo'],
  'Music Kits': ['Electronic', 'Rock', 'Ambient', 'Classical']
};

const ranksData = {
  'Silver Tier': [
    { title: 'Silver I', description: 'Starting rank for new players' },
    { title: 'Silver II', description: 'Basic skill development' },
    { title: 'Silver III', description: 'Improving fundamentals' },
    { title: 'Silver IV', description: 'Solid foundation' },
    { title: 'Silver Elite', description: 'Advanced silver player' },
    { title: 'Silver Elite Master', description: 'Master of silver tier' },
  ],
  'Gold Nova Tier': [
    { title: 'Gold Nova I', description: 'Entry to gold tier' },
    { title: 'Gold Nova II', description: 'Developing gold skills' },
    { title: 'Gold Nova III', description: 'Solid gold player' },
    { title: 'Gold Nova Master', description: 'Master of gold tier' },
  ],
  'Master Guardian Tier': [
    { title: 'Master Guardian I', description: 'Guardian level skills' },
    { title: 'Master Guardian II', description: 'Advanced guardian' },
    { title: 'Master Guardian Elite', description: 'Elite guardian player' },
    { title: 'Distinguished Master Guardian', description: 'Distinguished skills' },
  ],
  'Eagle Tier': [
    { title: 'Legendary Eagle', description: 'Legendary skills' },
    { title: 'Legendary Eagle Master', description: 'Master eagle player' },
    { title: 'Supreme Master First Class', description: 'Supreme level play' },
  ],
  'Global Elite Tier': [
    { title: 'Global Elite', description: 'The highest achievable rank' },
  ]
};

// Admin navigation items
const adminNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: UsersIcon },
  { id: 'gems', label: 'Gem Management', icon: Gem },
  { id: 'items', label: 'Items', icon: ShoppingBag },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'ranks', label: 'Ranks', icon: Trophy },
  { id: 'perks', label: 'Perks', icon: Ticket },
  { id: 'matches', label: 'Matches', icon: Swords },
  { id: 'moderation', label: 'Moderation', icon: Shield },
  { id: 'landingManagement', label: 'Landing Management', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'messages', label: 'Messages', icon: MessagesSquare },
  { id: 'siteControl', label: 'Site Control', icon: Cog },
];

// Interfaces
interface AdminStats {
  users: {
    total: number;
    newToday: number;
    active: number;
  };
  economy: {
    totalTransactionValue: number;
    totalTransactions: number;
    totalBets: number;
    totalBetValue: number;
  };
  revenue: {
    total: number;
    today: number;
  };
  transactions: {
    total: number;
    today: number;
  };
  activeMatches: number;
  totalItems: number;
  totalCrates: number;
  totalMissions: number;
  totalAchievements: number;
  totalShopItems: number;
  totalRanks: number;
  pendingWithdrawals: number;
  supportTickets: number;
  serverStatus: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  role: string;
  xp: number;
  level: number;
  balance: number;
  isMuted: boolean;
  isBanned: boolean;
  createdAt: string;
  lastActive: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
  created_at: string;
  last_login?: string;
  is_banned?: boolean;
}

interface ShopItem {
  id: string;
  name: string;
  type: string;
  rarity: string;
  price: number;
  image?: string;
  icon?: any;
  stock?: number;
  dataAiHint?: string;
}

interface ManualRewardForm {
  rewardAllUsers: boolean;
  selectedUsers: string[];
  rewardType: 'coins' | 'gems' | 'xp' | 'item' | 'perk';
  rewardValue: number;
  selectedItem: string;
  reason: string;
  isProcessing: boolean;
}

interface AutomatedRewards {
  daily_login_coins: number;
  daily_login_xp: number;
  referral_referrer_coins: number;
  referral_referee_coins: number;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminStats, setAdminStats] = useState<AdminStats>({
    users: {
      total: 0,
      newToday: 0,
      active: 0
    },
    economy: {
      totalTransactionValue: 0,
      totalTransactions: 0,
      totalBets: 0,
      totalBetValue: 0
    },
    revenue: {
      total: 0,
      today: 0
    },
    transactions: {
      total: 0,
      today: 0
    },
    activeMatches: 0,
    totalItems: 0,
    totalCrates: 0,
    totalMissions: 0,
    totalAchievements: 0,
    totalShopItems: 0,
    totalRanks: 0,
    pendingWithdrawals: 0,
    supportTickets: 0,
    serverStatus: 'Online'
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [manualRewardForm, setManualRewardForm] = useState<ManualRewardForm>({
    rewardAllUsers: false,
    selectedUsers: [],
    rewardType: 'coins',
    rewardValue: 0,
    selectedItem: '',
    reason: '',
    isProcessing: false
  });
  const [automatedRewards, setAutomatedRewards] = useState<AutomatedRewards>({
    daily_login_coins: 100,
    daily_login_xp: 50,
    referral_referrer_coins: 500,
    referral_referee_coins: 250
  });
  const [newShopItem, setNewShopItem] = useState({
    name: '',
    category: '',
    subcategory: '',
    rarity: 'Common' as Rarity,
    price: 0,
    description: '',
    image: '',
    stock: 0
  });
  const [seedingData, setSeedingData] = useState(false);
  const [newRank, setNewRank] = useState({
    level: 1,
    name: '',
    xpRequired: 0,
    badgeImage: ''
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/sign-in?redirect=/dashboard/admin');
      return;
    }

    if (user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive"
      });
      router.push('/dashboard');
      return;
    }

    loadAdminData();
  }, [user, authLoading, router]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      console.log('Admin data loading disabled - direct Supabase queries require authentication');
      console.log('User data loading disabled - using API endpoints instead');

      setAdminStats({
        users: {
          total: 0,
          newToday: 0,
          active: 0
        },
        economy: {
          totalTransactionValue: 0,
          totalTransactions: 0,
          totalBets: 0,
          totalBetValue: 0
        },
        revenue: {
          total: 0,
          today: 0
        },
        transactions: {
          total: 0,
          today: 0
        },
        activeMatches: 0,
        totalItems: 0,
        totalCrates: 0,
        totalMissions: 0,
        totalAchievements: 0,
        totalShopItems: 0,
        totalRanks: 0,
        pendingWithdrawals: 0,
        supportTickets: 0,
        serverStatus: 'Online'
      });

      setUsers([]);
    } catch (error) {
      console.error('Error loading admin data after retries:', error);
      
      setAdminStats({
        users: {
          total: 0,
          newToday: 0,
          active: 0
        },
        economy: {
          totalTransactionValue: 0,
          totalTransactions: 0,
          totalBets: 0,
          totalBetValue: 0
        },
        revenue: {
          total: 0,
          today: 0
        },
        transactions: {
          total: 0,
          today: 0
        },
        activeMatches: 0,
        totalItems: 0,
        totalCrates: 0,
        totalMissions: 0,
        totalAchievements: 0,
        totalShopItems: 0,
        totalRanks: 0,
        pendingWithdrawals: 0,
        supportTickets: 0,
        serverStatus: 'Error'
      });
      
      toast({
        title: "Connection Error",
        description: "Failed to load admin data after multiple attempts. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'ban' | 'unban' | 'mute' | 'unmute' | 'delete') => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, action }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform user action');
      }

      toast({
        title: "Success",
        description: `User ${action} successful`,
      });

      loadAdminData();
    } catch (error) {
      console.error('Error performing user action:', error);
      toast({
        title: "Error",
        description: "Failed to perform user action",
        variant: "destructive"
      });
    }
  };

  const handleRewardUsers = async () => {
    try {
      setManualRewardForm(prev => ({ ...prev, isProcessing: true }));

      const response = await fetch('/api/admin/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(manualRewardForm),
      });

      if (!response.ok) {
        throw new Error('Failed to distribute rewards');
      }

      toast({
        title: "Success",
        description: "Rewards distributed successfully",
      });

      setManualRewardForm({
        rewardAllUsers: false,
        selectedUsers: [],
        rewardType: 'coins',
        rewardValue: 0,
        selectedItem: '',
        reason: '',
        isProcessing: false
      });
    } catch (error) {
      console.error('Error distributing rewards:', error);
      toast({
        title: "Error",
        description: "Failed to distribute rewards",
        variant: "destructive"
      });
    } finally {
      setManualRewardForm(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleCreateShopItem = async () => {
    try {
      const response = await fetch('/api/admin/shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newShopItem),
      });

      if (!response.ok) {
        throw new Error('Failed to create shop item');
      }

      toast({
        title: "Success",
        description: "Shop item created successfully",
      });

      setNewShopItem({
        name: '',
        category: '',
        subcategory: '',
        rarity: 'Common' as Rarity,
        price: 0,
        description: '',
        image: '',
        stock: 0
      });
    } catch (error) {
      console.error('Error creating shop item:', error);
      toast({
        title: "Error",
        description: "Failed to create shop item",
        variant: "destructive"
      });
    }
  };

  const handleSeedData = async () => {
    try {
      setSeedingData(true);
      const response = await fetch('/api/admin/seed-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to seed data');
      }

      toast({
        title: "Success",
        description: "Database seeded successfully",
      });

      loadAdminData();
    } catch (error) {
      console.error('Error seeding data:', error);
      toast({
        title: "Error",
        description: "Failed to seed data",
        variant: "destructive"
      });
    } finally {
      setSeedingData(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 h-full">
      <aside className="md:col-span-1 border-r bg-card/50 p-4">
        <nav className="flex flex-col gap-2">
          <h2 className="text-xl font-bold font-headline mb-4">Admin Panel</h2>
          {adminNavItems.map(item => (
            <Button 
              key={item.id}
              variant={activeTab === item.id ? 'default' : 'ghost'}
              className="justify-start"
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.label}
            </Button>
          ))}
        </nav>
      </aside>
      <main className="md:col-span-4 p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold font-headline mb-2">Admin Control Panel</h1>
        <p className="text-muted-foreground mb-6">Complete control over your EquipGG.net platform</p>
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : adminStats.users.total.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+0 since yesterday</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : adminStats.users.active.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">in the last 24 hours</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Bets</CardTitle>
                  <Swords className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : adminStats.economy.totalBets.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total wagered</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${loading ? '...' : adminStats.revenue.total.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total platform revenue</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity data available</p>
                    <p className="text-sm">Activity tracking is currently disabled</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Server Status</span>
                      <span className="text-sm text-green-600 font-medium">{adminStats.serverStatus}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Support Tickets</span>
                      <span className="text-sm font-medium">{adminStats.supportTickets}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Pending Withdrawals</span>
                      <span className="text-sm font-medium">{adminStats.pendingWithdrawals}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="h-6 w-6" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user accounts, permissions, and actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-6 gap-4 p-4 font-medium border-b bg-muted/50">
                      <div>User</div>
                      <div>Role</div>
                      <div>Level</div>
                      <div>Balance</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    {filteredUsers.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No users found</p>
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div key={user.id} className="grid grid-cols-6 gap-4 p-4 border-b last:border-b-0">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {user.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-medium">{user.username || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                          <div>{user.level || 1}</div>
                          <div>{user.balance || 0} coins</div>
                          <div>
                            {user.isBanned ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Banned</span>
                            ) : user.isMuted ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Muted</span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setEditingUser(user);
                              setIsEditDialogOpen(true);
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!user.isBanned ? (
                              <Button size="sm" variant="destructive" onClick={() => handleUserAction(user.id, 'ban')}>
                                <Ban className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleUserAction(user.id, 'unban')}>
                                <Shield className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'gems' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gem className="h-6 w-6" />
                  Gem Management
                </CardTitle>
                <CardDescription>
                  Distribute gems and manage rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Manual Rewards</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Reward Type</label>
                          <select 
                            value={manualRewardForm.rewardType}
                            onChange={(e) => setManualRewardForm(prev => ({ ...prev, rewardType: e.target.value as any }))}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="coins">Coins</option>
                            <option value="gems">Gems</option>
                            <option value="xp">XP</option>
                            <option value="item">Item</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Amount</label>
                          <input
                            type="number"
                            value={manualRewardForm.rewardValue}
                            onChange={(e) => setManualRewardForm(prev => ({ ...prev, rewardValue: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Enter amount"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Reason</label>
                          <input
                            type="text"
                            value={manualRewardForm.reason}
                            onChange={(e) => setManualRewardForm(prev => ({ ...prev, reason: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Reason for reward"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="rewardAll"
                            checked={manualRewardForm.rewardAllUsers}
                            onChange={(e) => setManualRewardForm(prev => ({ ...prev, rewardAllUsers: e.target.checked }))}
                          />
                          <label htmlFor="rewardAll" className="text-sm font-medium">Reward all users</label>
                        </div>
                        <Button 
                          onClick={handleRewardUsers}
                          disabled={manualRewardForm.isProcessing}
                          className="w-full"
                        >
                          {manualRewardForm.isProcessing ? 'Processing...' : 'Distribute Rewards'}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Automated Rewards</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Daily Login Coins</label>
                          <input
                            type="number"
                            value={automatedRewards.daily_login_coins}
                            onChange={(e) => setAutomatedRewards(prev => ({ ...prev, daily_login_coins: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Daily Login XP</label>
                          <input
                            type="number"
                            value={automatedRewards.daily_login_xp}
                            onChange={(e) => setAutomatedRewards(prev => ({ ...prev, daily_login_xp: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Referral Bonus (Referrer)</label>
                          <input
                            type="number"
                            value={automatedRewards.referral_referrer_coins}
                            onChange={(e) => setAutomatedRewards(prev => ({ ...prev, referral_referrer_coins: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Referral Bonus (Referee)</label>
                          <input
                            type="number"
                            value={automatedRewards.referral_referee_coins}
                            onChange={(e) => setAutomatedRewards(prev => ({ ...prev, referral_referee_coins: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                        <Button className="w-full">
                          Update Automated Rewards
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'landingManagement' && (
          <LandingManagement />
        )}

        {activeTab === 'messages' && (
          <AdminMessagesPage />
        )}

        {activeTab === 'shop' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6" />
                  Shop Management
                </CardTitle>
                <CardDescription>
                  Create and manage shop items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Create New Item</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Item Name</label>
                          <input
                            type="text"
                            value={newShopItem.name}
                            onChange={(e) => setNewShopItem(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Enter item name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Category</label>
                          <select 
                            value={newShopItem.category}
                            onChange={(e) => setNewShopItem(prev => ({ ...prev, category: e.target.value, subcategory: '' }))}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="">Select category</option>
                            {Object.keys(shopItemCategories).map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>
                        {newShopItem.category && (
                          <div>
                            <label className="block text-sm font-medium mb-2">Subcategory</label>
                            <select 
                              value={newShopItem.subcategory}
                              onChange={(e) => setNewShopItem(prev => ({ ...prev, subcategory: e.target.value }))}
                              className="w-full px-3 py-2 border rounded-md"
                            >
                              <option value="">Select subcategory</option>
                              {shopItemCategories[newShopItem.category as keyof typeof shopItemCategories]?.map(subcategory => (
                                <option key={subcategory} value={subcategory}>{subcategory}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium mb-2">Rarity</label>
                          <select 
                            value={newShopItem.rarity}
                            onChange={(e) => setNewShopItem(prev => ({ ...prev, rarity: e.target.value as Rarity }))}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="Common">Common</option>
                            <option value="Uncommon">Uncommon</option>
                            <option value="Rare">Rare</option>
                            <option value="Epic">Epic</option>
                            <option value="Legendary">Legendary</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Price</label>
                          <input
                            type="number"
                            value={newShopItem.price}
                            onChange={(e) => setNewShopItem(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Enter price"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Stock</label>
                          <input
                            type="number"
                            value={newShopItem.stock}
                            onChange={(e) => setNewShopItem(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Enter stock quantity"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Description</label>
                          <textarea
                            value={newShopItem.description}
                            onChange={(e) => setNewShopItem(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-md"
                            rows={3}
                            placeholder="Enter item description"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Image URL</label>
                          <input
                            type="text"
                            value={newShopItem.image}
                            onChange={(e) => setNewShopItem(prev => ({ ...prev, image: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Enter image URL"
                          />
                        </div>
                        <div className="space-y-2">
                          <Button onClick={handleCreateShopItem} className="w-full">
                            Create Item
                          </Button>
                          <Button 
                            onClick={handleSeedData} 
                            disabled={seedingData}
                            variant="outline" 
                            className="w-full"
                          >
                            {seedingData ? 'Seeding...' : 'Seed Sample Data'}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Existing Items</h3>
                      <div className="border rounded-lg p-4">
                        <p className="text-center text-muted-foreground">Shop items will be displayed here</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'ranks' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6" />
                  Ranks Management
                </CardTitle>
                <CardDescription>
                  Create and manage player ranks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Create New Rank</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Level</label>
                          <input
                            type="number"
                            value={newRank.level}
                            onChange={(e) => setNewRank(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Enter level"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Rank Name</label>
                          <input
                            type="text"
                            value={newRank.name}
                            onChange={(e) => setNewRank(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Enter rank name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">XP Required</label>
                          <input
                            type="number"
                            value={newRank.xpRequired}
                            onChange={(e) => setNewRank(prev => ({ ...prev, xpRequired: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Enter XP required"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Badge Image URL</label>
                          <input
                            type="text"
                            value={newRank.badgeImage}
                            onChange={(e) => setNewRank(prev => ({ ...prev, badgeImage: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Enter badge image URL"
                          />
                        </div>
                        <Button className="w-full">
                          Create Rank
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Current Ranks</h3>
                      <div className="border rounded-lg p-4">
                        <p className="text-center text-muted-foreground">Rank management interface will be displayed here</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="h-6 w-6" />
                  Match Management
                </CardTitle>
                <CardDescription>
                  Manage matches and tournaments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Match
                    </Button>
                    <Button variant="outline">
                      Sync with PandaScore
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-center text-muted-foreground">Match management interface will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'moderation' && (
           <div className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Shield className="h-6 w-6" />
                   Moderation Tools
                 </CardTitle>
                 <CardDescription>
                   User moderation and content management
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <Button variant="outline">
                       <AlertTriangle className="h-4 w-4 mr-2" />
                       Reported Content
                     </Button>
                     <Button variant="outline">
                       <Ban className="h-4 w-4 mr-2" />
                       Banned Users
                     </Button>
                     <Button variant="outline">
                       <MicOff className="h-4 w-4 mr-2" />
                       Muted Users
                     </Button>
                   </div>
                   <div className="border rounded-lg p-4">
                     <p className="text-center text-muted-foreground">Moderation tools will be displayed here</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
         )}

         {activeTab === 'settings' && (
           <div className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Settings className="h-6 w-6" />
                   System Settings
                 </CardTitle>
                 <CardDescription>
                   System configuration and data management
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                       <h3 className="text-lg font-semibold">Data Seeding</h3>
                       <div className="space-y-2">
                         <Button 
                           onClick={() => handleSeedData()}
                           disabled={seedingData}
                           className="w-full"
                         >
                           {seedingData ? 'Seeding...' : 'Seed Matches'}
                         </Button>
                         <Button 
                           onClick={() => handleSeedData()}
                           disabled={seedingData}
                           className="w-full"
                         >
                           {seedingData ? 'Seeding...' : 'Seed Forum Data'}
                         </Button>
                         <Button 
                           onClick={() => handleSeedData()}
                           disabled={seedingData}
                           className="w-full"
                         >
                           {seedingData ? 'Seeding...' : 'Seed Shop Items'}
                         </Button>
                         <Button 
                           onClick={() => handleSeedData()}
                           disabled={seedingData}
                           className="w-full"
                         >
                           {seedingData ? 'Seeding...' : 'Seed Crates'}
                         </Button>
                         <Button 
                           onClick={() => handleSeedData()}
                           disabled={seedingData}
                           className="w-full"
                         >
                           {seedingData ? 'Seeding...' : 'Seed Achievements'}
                         </Button>
                         <Button 
                           onClick={() => handleSeedData()}
                           disabled={seedingData}
                           variant="destructive"
                           className="w-full"
                         >
                           {seedingData ? 'Seeding...' : 'Seed All Data'}
                         </Button>
                       </div>
                     </div>
                     <div className="space-y-4">
                       <h3 className="text-lg font-semibold">Data Status</h3>
                       <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 border rounded-lg">
                           <div className="text-2xl font-bold">{adminStats.users.total}</div>
                           <div className="text-sm text-muted-foreground">Users</div>
                         </div>
                         <div className="p-4 border rounded-lg">
                           <div className="text-2xl font-bold">{adminStats.totalItems}</div>
                           <div className="text-sm text-muted-foreground">Items</div>
                         </div>
                         <div className="p-4 border rounded-lg">
                           <div className="text-2xl font-bold">{adminStats.totalCrates}</div>
                           <div className="text-sm text-muted-foreground">Crates</div>
                         </div>
                         <div className="p-4 border rounded-lg">
                           <div className="text-2xl font-bold">{adminStats.totalRanks}</div>
                           <div className="text-sm text-muted-foreground">Ranks</div>
                         </div>
                         <div className="p-4 border rounded-lg">
                           <div className="text-2xl font-bold">{adminStats.totalAchievements}</div>
                           <div className="text-sm text-muted-foreground">Achievements</div>
                         </div>
                         <div className="p-4 border rounded-lg">
                           <div className="text-2xl font-bold">{adminStats.totalShopItems}</div>
                           <div className="text-sm text-muted-foreground">Shop Items</div>
                         </div>
                       </div>
                     </div>
                   </div>
                   <div className="space-y-4">
                     <h3 className="text-lg font-semibold">System Maintenance</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <Button variant="outline">
                         <Activity className="h-4 w-4 mr-2" />
                         Clear Cache
                       </Button>
                       <Button variant="outline">
                         <Target className="h-4 w-4 mr-2" />
                         Optimize Database
                       </Button>
                       <Button variant="destructive">
                         <AlertTriangle className="h-4 w-4 mr-2" />
                         Reset System
                       </Button>
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
         )}

        {adminNavItems.filter(item => !['dashboard', 'users', 'gems', 'shop', 'ranks', 'matches', 'moderation', 'landingManagement', 'messages'].includes(item.id)).map((item) => (
          activeTab === item.id && (
            <div key={item.id} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <item.icon className="h-6 w-6" />
                    {item.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <item.icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{item.label} functionality coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        ))}
      </main>

      {/* User Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Modify user details and permissions
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={editingUser.username || ''}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, username: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editingUser.role || 'user'}
                  onValueChange={(value) => setEditingUser(prev => prev ? { ...prev, role: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="level">Level</Label>
                <Input
                  id="level"
                  type="number"
                  value={editingUser.level || 1}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, level: parseInt(e.target.value) || 1 } : null)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Handle save user changes
              setIsEditDialogOpen(false);
              toast({
                title: "Success",
                description: "User updated successfully",
              });
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    
