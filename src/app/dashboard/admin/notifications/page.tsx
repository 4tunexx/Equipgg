'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Send, Users, MessageSquare, Trophy, Coins, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
  user_id: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form states
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [newsTitle, setNewsTitle] = useState('');
  const [newsMessage, setNewsMessage] = useState('');
  const [targetUsers, setTargetUsers] = useState('all'); // all, admins, moderators, users

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/admin/notifications/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: announcementTitle,
          message: announcementMessage,
          targetUsers
        })
      });

      if (response.ok) {
        toast.success('Announcement sent successfully!');
        setAnnouncementTitle('');
        setAnnouncementMessage('');
        fetchNotifications();
      } else {
        toast.error('Failed to send announcement');
      }
    } catch (error) {
      toast.error('Error sending announcement');
    } finally {
      setSending(false);
    }
  };

  const sendNewsUpdate = async () => {
    if (!newsTitle.trim() || !newsMessage.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/admin/notifications/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newsTitle,
          message: newsMessage,
          targetUsers
        })
      });

      if (response.ok) {
        toast.success('News update sent successfully!');
        setNewsTitle('');
        setNewsMessage('');
        fetchNotifications();
      } else {
        toast.error('Failed to send news update');
      }
    } catch (error) {
      toast.error('Error sending news update');
    } finally {
      setSending(false);
    }
  };

  const createDemoNotifications = async (type: string, count: number = 1) => {
    try {
      const response = await fetch('/api/notifications/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, count })
      });

      if (response.ok) {
        toast.success(`Created ${count} ${type} notification(s)`);
        fetchNotifications();
      } else {
        toast.error('Failed to create demo notifications');
      }
    } catch (error) {
      toast.error('Error creating demo notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bet_won':
      case 'bet_lost':
      case 'game_result':
        return <Trophy className="h-4 w-4 text-green-500" />;
      case 'coin_reward':
      case 'purchase':
        return <Coins className="h-4 w-4 text-yellow-500" />;
      case 'admin_announcement':
      case 'news_update':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'support_ticket':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'friend_request':
      case 'message_received':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'bet_won':
      case 'coin_reward':
        return 'bg-green-100 text-green-800';
      case 'bet_lost':
        return 'bg-red-100 text-red-800';
      case 'admin_announcement':
        return 'bg-blue-100 text-blue-800';
      case 'news_update':
        return 'bg-purple-100 text-purple-800';
      case 'support_ticket':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading notifications...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Management</h1>
          <p className="text-muted-foreground">Manage system notifications and announcements</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => createDemoNotifications('all')} variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Create Demo Notifications
          </Button>
        </div>
      </div>

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send">Send Notifications</TabsTrigger>
          <TabsTrigger value="history">Notification History</TabsTrigger>
          <TabsTrigger value="demo">Demo Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Announcements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Site Announcements
                </CardTitle>
                <CardDescription>
                  Send important announcements to users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Target Users</label>
                  <Select value={targetUsers} onValueChange={setTargetUsers}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="admins">Admins Only</SelectItem>
                      <SelectItem value="moderators">Moderators Only</SelectItem>
                      <SelectItem value="users">Regular Users Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Announcement title"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Announcement message"
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button onClick={sendAnnouncement} disabled={sending} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Announcement'}
                </Button>
              </CardContent>
            </Card>

            {/* News Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  News Updates
                </CardTitle>
                <CardDescription>
                  Send news and updates to users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Target Users</label>
                  <Select value={targetUsers} onValueChange={setTargetUsers}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="admins">Admins Only</SelectItem>
                      <SelectItem value="moderators">Moderators Only</SelectItem>
                      <SelectItem value="users">Regular Users Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="News title"
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="News message"
                    value={newsMessage}
                    onChange={(e) => setNewsMessage(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button onClick={sendNewsUpdate} disabled={sending} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send News Update'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>
                View all notifications sent to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No notifications found</p>
                ) : (
                  notifications.slice(0, 20).map((notification) => (
                    <div key={notification.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{notification.title}</h4>
                          <Badge className={getNotificationBadgeColor(notification.type)}>
                            {notification.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demo Notifications</CardTitle>
              <CardDescription>
                Create sample notifications to test the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <Button onClick={() => createDemoNotifications('bet_won')} variant="outline" size="sm">
                  <Trophy className="h-4 w-4 mr-2" />
                  Bet Won
                </Button>
                <Button onClick={() => createDemoNotifications('bet_lost')} variant="outline" size="sm">
                  <Trophy className="h-4 w-4 mr-2" />
                  Bet Lost
                </Button>
                <Button onClick={() => createDemoNotifications('game_result')} variant="outline" size="sm">
                  <Trophy className="h-4 w-4 mr-2" />
                  Game Result
                </Button>
                <Button onClick={() => createDemoNotifications('achievement')} variant="outline" size="sm">
                  <Trophy className="h-4 w-4 mr-2" />
                  Achievement
                </Button>
                <Button onClick={() => createDemoNotifications('level_up')} variant="outline" size="sm">
                  <Trophy className="h-4 w-4 mr-2" />
                  Level Up
                </Button>
                <Button onClick={() => createDemoNotifications('coin_reward')} variant="outline" size="sm">
                  <Coins className="h-4 w-4 mr-2" />
                  Coin Reward
                </Button>
                <Button onClick={() => createDemoNotifications('purchase')} variant="outline" size="sm">
                  <Coins className="h-4 w-4 mr-2" />
                  Purchase
                </Button>
                <Button onClick={() => createDemoNotifications('admin_announcement')} variant="outline" size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Announcement
                </Button>
                <Button onClick={() => createDemoNotifications('news_update')} variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  News Update
                </Button>
                <Button onClick={() => createDemoNotifications('support_ticket')} variant="outline" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Support Ticket
                </Button>
                <Button onClick={() => createDemoNotifications('friend_request')} variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Friend Request
                </Button>
                <Button onClick={() => createDemoNotifications('message_received')} variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
