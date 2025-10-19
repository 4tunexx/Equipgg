'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { useAuth } from "../../../hooks/use-auth";
import { useToast } from "../../../hooks/use-toast";
import { 
  Send, 
  Search, 
  Settings,
  Users,
  Hash,
  Plus,
  Smile,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Volume2,
  VolumeX,
  UserPlus,
  MessageSquare,
  Globe,
  Lock,
  Crown,
  Star,
  Shield
} from 'lucide-react';
import { cn } from "../../../lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { useRealtime } from "../../../contexts/realtime-context";

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: string;
  timestamp: string;
  channelId: string;
  type: 'text' | 'image' | 'system';
  editedAt?: string;
  replyTo?: string;
}

interface ChatChannel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'direct';
  memberCount: number;
  isActive: boolean;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

interface ChatUser {
  id: string;
  displayName: string;
  avatar?: string;
  role: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: string;
}

const defaultChannels: ChatChannel[] = [
  {
    id: 'general',
    name: 'General',
    description: 'General discussion for all members',
    type: 'public',
    memberCount: 1247,
    isActive: true,
    unreadCount: 0
  },
  {
    id: 'trading',
    name: 'Trading',
    description: 'Buy, sell, and trade items',
    type: 'public',
    memberCount: 892,
    isActive: true,
    unreadCount: 12
  },
  {
    id: 'games',
    name: 'Games',
    description: 'Discuss CS2 matches and strategies',
    type: 'public',
    memberCount: 654,
    isActive: true,
    unreadCount: 0
  },
  {
    id: 'support',
    name: 'Support',
    description: 'Get help from moderators',
    type: 'public',
    memberCount: 89,
    isActive: true,
    unreadCount: 0
  }
];

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnected, onChatMessage, emitChatMessage } = useRealtime();
  const [activeChannel, setActiveChannel] = useState('general');
  const [channels, setChannels] = useState<ChatChannel[]>(defaultChannels);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load chat data regardless of user authentication
    fetchMessages();
    fetchOnlineUsers();
    
    // Join the active channel room
    if (isConnected) {
      console.log(`🔌 Joined chat channel: ${activeChannel}`);
    }
    
    return () => {
      // Leave channel when switching
      if (isConnected) {
        console.log(`👋 Left chat channel: ${activeChannel}`);
      }
    };
  }, [activeChannel, isConnected]);

  // Set up Realtime real-time message listener
  useEffect(() => {
    if (!isConnected) return;

    const handleNewMessage = (message: any) => {
      console.log('📨 Received new message:', message);
      // Only add if it's for the current channel and not already in the list
      if (message.channelId === activeChannel) {
        setMessages(prev => {
          // Check if message already exists
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, {
            id: message.id,
            content: message.message || message.content || '',
            senderId: message.sender?.id || message.senderId || 'unknown',
            senderName: message.sender?.display_name || message.sender?.displayName || message.senderName || 'Anonymous',
            senderAvatar: message.sender?.avatar_url || message.sender?.avatar || message.senderAvatar,
            senderRole: message.sender?.role || message.senderRole || 'user',
            timestamp: message.timestamp || message.created_at || new Date().toISOString(),
            channelId: message.channelId || message.channel_id || activeChannel,
            type: message.type || 'text'
          }];
        });
      }
    };

    onChatMessage(handleNewMessage);

    return () => {
      // Cleanup
    };
  }, [isConnected, activeChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      // Try to fetch messages with authentication if user is logged in
      const headers: HeadersInit = {};
      if (user) {
        // Add any authentication headers if available
        headers['Content-Type'] = 'application/json';
      }
      
      const response = await fetch(`/api/chat/messages?channelId=${activeChannel}&limit=50`, {
        headers,
        credentials: 'include' // Include cookies for authentication
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          // Map messages to ensure all required fields exist
          const mappedMessages = data.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content || '',
            senderId: msg.sender_id || msg.sender?.id || 'unknown',
            senderName: msg.sender?.displayname || 'Anonymous',
            senderAvatar: msg.sender?.avatar_url,
            senderRole: msg.sender?.role || 'user',
            timestamp: msg.created_at || new Date().toISOString(),
            channelId: msg.channel_id || activeChannel,
            type: msg.type || 'text'
          }));
          setMessages(mappedMessages);
        } else {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Start with empty chat on error
      setMessages([]);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const response = await fetch('/api/chat/online-users');
      if (!response.ok) {
        throw new Error('Failed to fetch online users');
      }
      
      const data = await response.json();
      setOnlineUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching online users:', error);
      // Start with empty online users list on error
      setOnlineUsers([]);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send messages",
        variant: "destructive"
      });
      return;
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageInput.trim(),
      senderId: user.id,
      senderName: user.displayName || 'Anonymous',
      senderRole: user.role || 'user',
      timestamp: new Date().toISOString(),
      channelId: activeChannel,
      type: 'text'
    };

    try {
      setLoading(true);
      
      // Try to send to server
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          channelId: activeChannel,
          content: messageInput.trim()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message - authentication required');
      }

      const data = await response.json();
      
      // Emit via Supabase Realtime for real-time delivery
      if (isConnected && data.message) {
        await emitChatMessage({
          id: data.message.id,
          channelId: activeChannel,
          userId: user.id,
          username: user.displayName || 'Anonymous',
          avatar: user.photoURL,
          message: data.message.content,
          timestamp: data.message.created_at || new Date().toISOString()
        });
      }
      
      setMessageInput('');
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message - please try logging in again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'moderator': return <Shield className="w-3 h-3 text-blue-500" />;
      case 'vip': return <Star className="w-3 h-3 text-purple-500" />;
      default: return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-yellow-500';
      case 'moderator': return 'text-blue-500';
      case 'vip': return 'text-purple-500';
      case 'system': return 'text-gray-400';
      default: return 'text-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentChannel = channels.find(c => c.id === activeChannel);

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Chat</h2>
              {isConnected ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                  Disconnected
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="ghost">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2">
              <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                CHANNELS
              </div>
              {filteredChannels.map((channel) => (
                <Button
                  key={channel.id}
                  variant={activeChannel === channel.id ? "secondary" : "ghost"}
                  className="w-full justify-start mb-1 h-auto py-2"
                  onClick={() => setActiveChannel(channel.id)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Hash className="w-4 h-4" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{channel.name}</span>
                        {channel.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 text-xs">
                            {channel.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {channel.memberCount} members
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Online Users */}
        <div className="border-t p-2">
          <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
            ONLINE — {onlineUsers.filter(u => u.status === 'online').length}
          </div>
          <ScrollArea className="h-32">
            {onlineUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-2 px-2 py-1 hover:bg-muted/50 rounded cursor-pointer">
                <div className="relative">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-xs">{user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                    getStatusColor(user.status)
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    {getRoleIcon(user.role)}
                    <span className={cn("text-sm font-medium truncate", getRoleColor(user.role))}>
                      {user.displayName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-16 border-b bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Hash className="w-5 h-5" />
            <div>
              <h3 className="font-semibold">{currentChannel?.name}</h3>
              <p className="text-sm text-muted-foreground">{currentChannel?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost">
              <Phone className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost">
              <Video className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost">
              <UserPlus className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="flex gap-3 group hover:bg-muted/30 -mx-4 px-4 py-1 rounded">
                    <Avatar className="w-8 h-8 mt-0.5">
                      <AvatarImage src={message.senderAvatar} />
                      <AvatarFallback className="text-xs">{(message.senderName || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1">
                          {getRoleIcon(message.senderRole)}
                          <span className={cn("font-semibold text-sm", getRoleColor(message.senderRole))}>
                            {message.senderName || 'Anonymous'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="text-sm leading-relaxed">
                        {message.type === 'system' ? (
                          <span className="italic text-muted-foreground">{message.content}</span>
                        ) : (
                          <span>{message.content}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Message Input */}
        <div className="border-t bg-card p-4">
          {!user ? (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground mb-2">
                Please log in to send messages
              </p>
              <Button 
                onClick={() => window.location.href = '/auth/login'}
                size="sm"
                variant="outline"
              >
                Login to Chat
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    placeholder={`Message #${currentChannel?.name}`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pr-20"
                    disabled={loading}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Smile className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!messageInput.trim() || loading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}