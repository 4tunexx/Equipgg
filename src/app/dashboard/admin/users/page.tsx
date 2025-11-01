'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { useToast } from "../../../../hooks/use-toast";
import { getLevelFromXP } from "../../../../lib/xp-config";
import { useAuth } from "../../../../hooks/use-auth";
import { supabase } from "../../../../lib/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Gift, Search, Users, Key } from 'lucide-react';
import { GiveCrateKeysDialog } from "../../../../components/admin/give-crate-keys-dialog";
import { Badge } from "../../../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";

interface User {
  id: string;
  username: string;
  email?: string;
  level: number;
  xp: number;
  coins: number;
  gems?: number;
  role?: string;
  created_at: string;
  rank?: string;
}

interface UserCrateKeys {
  crate_id: number;
  keys_count: number;
  crate?: {
    name: string;
  };
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showGiveKeysDialog, setShowGiveKeysDialog] = useState(false);
  const [userKeys, setUserKeys] = useState<Record<string, UserCrateKeys[]>>({});
  const [userRanks, setUserRanks] = useState<Record<string, string>>({});
  const [userItemCounts, setUserItemCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, email, level, xp, coins, gems, role, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (usersError) throw usersError;

      const fixed = (usersData || []).map((u: any) => ({
        ...u,
        level: getLevelFromXP(u.xp || 0)
      }));
      setUsers(fixed);
      
      // Fetch ranks for all users
      if (usersData) {
        const ranksMap: Record<string, string> = {};
        // Fetch all active ranks once for efficiency - order by min_level ASCENDING to find correct rank
        const { data: allRanks, error: ranksError } = await supabase
          .from('ranks')
          .select('name, min_level, max_level')
          .eq('is_active', true)
          .order('min_level', { ascending: true }); // Order ascending to iterate correctly
        
        if (ranksError) {
          console.error('Error fetching ranks:', ranksError);
          // Set default rank for all users if ranks fetch fails
          usersData.forEach((userData: any) => {
            ranksMap[userData.id] = 'Silver I';
          });
        } else {
          // Calculate rank for each user
          for (const userData of usersData) {
            const computedLevel = getLevelFromXP(userData.xp || 0);
            
            // Find the highest rank that matches the user's level
            let userRank = 'Silver I'; // Default fallback
            
            if (allRanks && allRanks.length > 0) {
              // Find the highest matching rank by checking from highest to lowest
              // Reverse the array to check highest ranks first
              const ranksReversed = [...allRanks].reverse();
              
              const matchingRank = ranksReversed.find(rank => {
                const minMatches = (rank.min_level || 0) <= computedLevel;
                const maxMatches = rank.max_level === null || rank.max_level >= computedLevel;
                return minMatches && maxMatches;
              });
              
              if (matchingRank) {
                userRank = matchingRank.name;
                console.log(`User ${userData.id} (level ${computedLevel}) -> Rank: ${userRank} (min: ${matchingRank.min_level}, max: ${matchingRank.max_level})`);
              } else {
                // If no match found, user might be below all ranks - use lowest rank
                const lowestRank = allRanks[0];
                if (lowestRank) {
                  userRank = lowestRank.name;
                  console.log(`User ${userData.id} (level ${computedLevel}) -> No matching rank, using lowest: ${userRank}`);
                }
              }
            }
            
            ranksMap[userData.id] = userRank;
          }
        }
        setUserRanks(ranksMap);
      }

      // Fetch item counts for all users (sum quantities for stacked items)
      if (usersData) {
        const itemCountsMap: Record<string, number> = {};
        
        // Fetch inventory for all users at once
        const userIds = usersData.map(u => u.id);
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('user_inventory')
          .select('user_id, quantity')
          .in('user_id', userIds);
        
        if (inventoryError) {
          console.error('Error fetching inventory:', inventoryError);
          // Set 0 for all users if inventory fetch fails
          usersData.forEach((userData: any) => {
            itemCountsMap[userData.id] = 0;
          });
        } else if (inventoryData) {
          // Sum quantities for each user
          inventoryData.forEach((item: any) => {
            const userId = item.user_id;
            const quantity = item.quantity || 1; // Default to 1 if quantity is missing
            
            if (!itemCountsMap[userId]) {
              itemCountsMap[userId] = 0;
            }
            itemCountsMap[userId] += quantity;
          });
          
          // Set 0 for users with no inventory
          usersData.forEach((userData: any) => {
            if (!itemCountsMap[userData.id]) {
              itemCountsMap[userData.id] = 0;
            }
          });
        } else {
          // No inventory data, set 0 for all users
          usersData.forEach((userData: any) => {
            itemCountsMap[userData.id] = 0;
          });
        }
        
        setUserItemCounts(itemCountsMap);
      }

      // Fetch crate keys for all users
      const { data: keysData, error: keysError } = await supabase
        .from('user_keys')
        .select('user_id, crate_id, keys_count, crate:crates(name)');
      
      if (keysError) {
        console.error('Error fetching crate keys:', keysError);
        // Continue without keys data - not critical, set empty map
        setUserKeys({});
      } else if (keysData) {
        const keysMap: Record<string, UserCrateKeys[]> = {};
        keysData.forEach((key: any) => {
          if (!keysMap[key.user_id]) {
            keysMap[key.user_id] = [];
          }
          // Handle both single crate object and array (Supabase relation format)
          const crateObj = Array.isArray(key.crate) ? key.crate[0] : key.crate;
          keysMap[key.user_id].push({
            crate_id: key.crate_id,
            keys_count: key.keys_count,
            crate: crateObj
          });
        });
        setUserKeys(keysMap);
      } else {
        setUserKeys({});
      }
    } catch (error) {
        console.error('Error fetching users:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage
        });
        // Set empty arrays on error to prevent UI breaking
        setUsers([]);
        setUserRanks({});
        setUserKeys({});
        setUserItemCounts({});
      } finally {
        setIsLoading(false);
      }
    };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.includes(searchQuery)
  );

  const handleGiveKeys = (user: User) => {
    setSelectedUser(user);
    setShowGiveKeysDialog(true);
  };

  const getTotalKeys = (userId: string) => {
    const keys = userKeys[userId] || [];
    return keys.reduce((sum, k) => sum + k.keys_count, 0);
  };

  if (!user) {
    return <div className="p-8">Please log in to access admin panel</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            User Management
          </h1>
          <p className="text-muted-foreground">Manage users and give crate keys</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Search and manage all users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by username, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={fetchUsers}>
              Refresh
            </Button>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Username</TableHead>
                    <TableHead className="min-w-[120px]">Role</TableHead>
                    <TableHead className="min-w-[80px]">Level</TableHead>
                    <TableHead className="min-w-[120px]">Rank</TableHead>
                    <TableHead className="min-w-[100px]">Items</TableHead>
                    <TableHead className="min-w-[100px]">Coins</TableHead>
                    {users.some(u => u.gems !== undefined && u.gems !== null && u.gems > 0) && (
                      <TableHead className="min-w-[100px]">Gems</TableHead>
                    )}
                    <TableHead className="min-w-[100px]">Total Keys</TableHead>
                    <TableHead className="min-w-[150px]">Crate Keys</TableHead>
                    <TableHead className="text-right min-w-[150px] sticky right-0 bg-background">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={users.some(u => u.gems !== undefined && u.gems !== null && u.gems > 0) ? 10 : 9} className="text-center text-muted-foreground py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium" style={{
                              color: user.role === 'admin' ? '#ef4444' : 
                                     user.role === 'moderator' ? '#3b82f6' : 
                                     user.role === 'vip' ? '#fbbf24' : 
                                     user.role === 'insider' ? '#a855f7' : 'inherit'
                            }}>
                              {user.username}
                            </p>
                            {user.email && (
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role || 'user'}
                            onValueChange={async (newRole) => {
                              try {
                                const { error } = await supabase
                                  .from('users')
                                  .update({ role: newRole })
                                  .eq('id', user.id);
                                
                                if (error) {
                                  throw error;
                                }
                                
                                toast({ 
                                  title: 'Role updated', 
                                  description: `${user.username} is now ${newRole}` 
                                });
                                
                                // Update local state immediately for better UX
                                setUsers(prevUsers => 
                                  prevUsers.map(u => 
                                    u.id === user.id ? { ...u, role: newRole } : u
                                  )
                                );
                                
                                // Optionally refresh to get latest data
                                // fetchUsers();
                              } catch (e) {
                                console.error('Error updating role:', e);
                                toast({ 
                                  variant: 'destructive', 
                                  title: 'Error updating role',
                                  description: e instanceof Error ? e.message : 'Failed to update user role'
                                });
                                // Refresh to revert UI state
                                fetchUsers();
                              }
                            }}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="vip">VIP</SelectItem>
                              <SelectItem value="insider">Insider</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Lv {user.level}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold">
                            {userRanks[user.id] || 'Calculating...'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-purple-400">
                            {userItemCounts[user.id] !== undefined ? userItemCounts[user.id].toLocaleString() : '...'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-green-400">{user.coins.toLocaleString()}</span>
                        </TableCell>
                        {users.some(u => u.gems !== undefined && u.gems !== null && u.gems > 0) && (
                          <TableCell>
                            <span className="font-mono text-cyan-400">{user.gems?.toLocaleString() || 0}</span>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Key className="w-4 h-4 text-primary" />
                            <span className="font-semibold">{getTotalKeys(user.id)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(userKeys[user.id] || []).map((key) => (
                              key.keys_count > 0 && (
                                <Badge key={key.crate_id} variant="outline" className="text-xs">
                                  {key.crate?.name.split(' ')[0]}: {key.keys_count}
                                </Badge>
                              )
                            ))}
                            {getTotalKeys(user.id) === 0 && (
                              <span className="text-xs text-muted-foreground">No keys</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right sticky right-0 bg-background">
                          <Button
                            size="sm"
                            onClick={() => handleGiveKeys(user)}
                            className="whitespace-nowrap bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            Give Keys
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardContent>
      </Card>

      {/* Give Keys Dialog */}
      {selectedUser && (
        <GiveCrateKeysDialog
          open={showGiveKeysDialog}
          onOpenChange={(open) => {
            setShowGiveKeysDialog(open);
            if (!open) {
              fetchUsers(); // Refresh after giving keys
            }
          }}
          userId={selectedUser.id}
          username={selectedUser.username}
        />
      )}
    </div>
  );
}
