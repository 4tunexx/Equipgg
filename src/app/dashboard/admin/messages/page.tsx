'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare, Newspaper, RefreshCw, Megaphone, Gamepad2, Settings } from 'lucide-react';

export default function AdminMessagesPage() {
  const [type, setType] = useState('news');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [targetUsers, setTargetUsers] = useState('all');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const messageTypes = [
    { value: 'news', label: 'News', icon: '📰', description: 'General news and updates' },
    { value: 'update', label: 'Update', icon: '🔄', description: 'Platform updates and maintenance' },
    { value: 'admin_announcement', label: 'Admin Announcement', icon: '📢', description: 'Important admin announcements' },
    { value: 'mod_announcement', label: 'Moderator Announcement', icon: '🎮', description: 'Moderator communications' },
    { value: 'system_notification', label: 'System Notification', icon: '⚙️', description: 'System-generated notifications' }
  ];

  const targetOptions = [
    { value: 'all', label: 'All Users', description: 'Send to everyone' },
    { value: 'admin', label: 'Admins Only', description: 'Send to admin users' },
    { value: 'moderator', label: 'Moderators Only', description: 'Send to moderator users' },
    { value: 'user', label: 'Regular Users', description: 'Send to regular users only' }
  ];

  const handleSendMessage = async () => {
    if (!subject.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both subject and content",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          subject,
          content,
          targetUsers
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Message sent to ${data.sentTo} users`
        });
        setSubject('');
        setContent('');
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send message",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMessageTypeIcon = (type: string) => {
    const messageType = messageTypes.find(t => t.value === type);
    return messageType?.icon || '💬';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send Message to Users
          </CardTitle>
          <CardDescription>
            Send different types of messages to users based on their roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Message Type Selection */}
          <div className="space-y-2">
            <Label>Message Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select message type" />
              </SelectTrigger>
              <SelectContent>
                {messageTypes.map((msgType) => (
                  <SelectItem key={msgType.value} value={msgType.value}>
                    <div className="flex items-center gap-2">
                      <span>{msgType.icon}</span>
                      <div>
                        <div className="font-medium">{msgType.label}</div>
                        <div className="text-xs text-muted-foreground">{msgType.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Users Selection */}
          <div className="space-y-2">
            <Label>Target Users</Label>
            <Select value={targetUsers} onValueChange={setTargetUsers}>
              <SelectTrigger>
                <SelectValue placeholder="Select target users" />
              </SelectTrigger>
              <SelectContent>
                {targetOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter message subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Message Content</Label>
            <Textarea
              id="content"
              placeholder="Enter your message content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>

          {/* Preview */}
          {subject && content && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-lg flex-shrink-0">
                      {getMessageTypeIcon(type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-blue-600">{subject}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {content.length > 100 ? content.substring(0, 100) + '...' : content}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-red-500">Admin</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Send Button */}
          <Button 
            onClick={handleSendMessage} 
            disabled={loading || !subject.trim() || !content.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Templates</CardTitle>
          <CardDescription>
            Use these templates to quickly send common messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setType('news');
                setSubject('🎉 New Features Released!');
                setContent('We\'ve added exciting new features to enhance your gaming experience. Check out the latest updates in the arcade and betting sections!');
              }}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-medium">📰 Feature Announcement</div>
                <div className="text-xs text-muted-foreground mt-1">Announce new features</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setType('update');
                setSubject('🔄 Platform Maintenance');
                setContent('Scheduled maintenance will be performed to improve platform performance. Some features may be temporarily unavailable.');
              }}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-medium">🔄 Maintenance Notice</div>
                <div className="text-xs text-muted-foreground mt-1">Notify about maintenance</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setType('admin_announcement');
                setSubject('📢 Important Security Update');
                setContent('We\'ve implemented enhanced security measures to protect your account. Please ensure your password is strong and unique.');
              }}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-medium">📢 Security Alert</div>
                <div className="text-xs text-muted-foreground mt-1">Security-related announcements</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setType('mod_announcement');
                setSubject('🎮 Tournament Results');
                setContent('Congratulations to all participants! Check out the leaderboard for this week\'s tournament winners and upcoming events.');
              }}
              className="h-auto p-4 text-left"
            >
              <div>
                <div className="font-medium">🎮 Tournament Update</div>
                <div className="text-xs text-muted-foreground mt-1">Tournament and event updates</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
