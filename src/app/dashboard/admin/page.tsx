"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { LineChart, Users as UsersIcon, ShoppingBag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// This admin page is adapted from your example (example-admin.txt).
// It uses the same left-nav + panels layout but fetches live read-only admin endpoints.
// Important: no seeding/populate or service-role usage is added.

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeNav, setActiveNav] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [showModeration, setShowModeration] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modAction, setModAction] = useState<'ban' | 'unban' | 'mute' | 'suspend'>('ban');
  const [modReason, setModReason] = useState('');
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', type: '', rarity: 'common', value: 0 });

  useEffect(() => {
    if (authLoading) return;
    if (!user) return router.push('/sign-in?redirect=/dashboard/admin');
    if (user.role !== 'admin') return router.push('/dashboard');

    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [uRes, iRes] = await Promise.all([
          fetch('/api/admin/users').catch(() => null),
          fetch('/api/admin/items').catch(() => null),
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
          <button onClick={() => setActiveNav('shop')} className={cn('flex items-center gap-2 px-3 py-2 rounded', activeNav === 'shop' ? 'bg-accent text-black' : 'text-muted-foreground')}>
            <ShoppingBag className="w-4 h-4" /> Shop
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
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <CardContent>
                <div className="text-sm text-muted-foreground">Total Users</div>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardContent>
                <div className="text-sm text-muted-foreground">Shop Items</div>
                <div className="text-2xl font-bold">{items.length}</div>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardContent>
                <div className="text-sm text-muted-foreground">Loading</div>
                <div className="text-2xl font-bold">{loading ? 'Yes' : 'No'}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeNav === 'users' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Users</h2>
            {loading ? <div>Loading...</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Avatar</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell><img src={u.avatar || u.avatarUrl || '/default-team-logo.png'} className="h-8 w-8 rounded" alt="avatar"/></TableCell>
                      <TableCell>{u.displayName || u.name || u.username || u.email}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => { setSelectedUser(u); setShowModeration(true); }}>Moderate</Button>
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
          <div>
            <h2 className="text-lg font-semibold mb-3">Shop Items</h2>
            <div className="mb-3">
              <Button onClick={() => setShowCreateItem(true)}>Create Item</Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {items.map(item => (
                <div key={item.id} className="p-3 border rounded">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{item.type || item.category || ''}</div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="destructive" onClick={async () => {
                      if (!confirm('Delete this item?')) return;
                      const res = await fetch(`/api/admin/items?id=${item.id}`, { method: 'DELETE' });
                      if (res.ok) {
                        setItems(items.filter((it: any) => it.id !== item.id));
                        alert('Item deleted');
                      } else {
                        const data = await res.json();
                        alert(data.error || 'Delete failed');
                      }
                    }}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
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
              <select value={modAction} onChange={(e) => setModAction(e.target.value as any)} className="w-full p-2 border rounded">
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Shop Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
              <Label>Type</Label>
              <Input value={newItem.type} onChange={(e) => setNewItem({ ...newItem, type: e.target.value })} />
              <Label>Rarity</Label>
              <Input value={newItem.rarity} onChange={(e) => setNewItem({ ...newItem, rarity: e.target.value })} />
              <Label>Value</Label>
              <Input value={String(newItem.value)} onChange={(e) => setNewItem({ ...newItem, value: Number(e.target.value || 0) })} />
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                const res = await fetch('/api/admin/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItem) });
                if (res.ok) {
                  const data = await res.json();
                  setItems([...(items || []), data.item]);
                  setShowCreateItem(false);
                  setNewItem({ name: '', type: '', rarity: 'common', value: 0 });
                  alert('Item created');
                } else {
                  const d = await res.json();
                  alert(d.error || 'Create failed');
                }
              }}>Create</Button>
              <Button variant="ghost" onClick={() => setShowCreateItem(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
