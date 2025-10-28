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
        for (const user of usersData) {
          const computedLevel = getLevelFromXP(user.xp || 0);
          const { data: rank } = await supabase
            .from('ranks')
            .select('name')
            .lte('min_level', computedLevel)
            .gte('max_level', computedLevel)
            .maybeSingle();
          ranksMap[user.id] = rank?.name || 'Silver I';
        }
        setUserRanks(ranksMap);
      }

      // Fetch crate keys for all users
      const { data: keysData } = await supabase
        .from('user_keys')
        .select('user_id, crate_id, keys_count, crate:crates(name)');

      if (keysData) {
        const keysMap: Record<string, UserCrateKeys[]> = {};
        keysData.forEach((key: any) => {
          if (!keysMap[key.user_id]) {
            keysMap[key.user_id] = [];
          }
          keysMap[key.user_id].push({
            crate_id: key.crate_id,
            keys_count: key.keys_count,
            crate: key.crate
          });
        });
        setUserKeys(keysMap);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users"
      });
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
                    <TableHead className="min-w-[100px]">Coins</TableHead>
                    <TableHead className="min-w-[100px]">Total Keys</TableHead>
                    <TableHead className="min-w-[150px]">Crate Keys</TableHead>
                    <TableHead className="text-right min-w-[150px] sticky right-0 bg-background">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
                                if (!error) {
                                  toast({ title: 'Role updated', description: `${user.username} is now ${newRole}` });
                                  fetchUsers();
                                }
                              } catch (e) {
                                toast({ variant: 'destructive', title: 'Error updating role' });
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
                            {userRanks[user.id] || 'Silver I'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{user.coins.toLocaleString()}</span>
                        </TableCell>
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
