'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { useAuth } from "../../../hooks/use-auth";
import { useToast } from "../../../hooks/use-toast";
import { useRealtime } from "../../../contexts/realtime-context";
import { 
  Send, 
  Hash,
  Smile,
  TrendingUp,
  DollarSign,
  Trophy
} from 'lucide-react';
import { cn } from "../../../lib/utils";
import { formatDistanceToNow } from 'date-fns';

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
}

const bettingChannels = [
  {
    id: 'betting-live',
    name: 'Live Betting',
    description: 'Discuss live bets and predictions',
    icon: TrendingUp,
    color: 'text-green-500'
  },
  {
    id: 'betting-tips',
    name: 'Betting Tips',
    description: 'Share and discuss betting strategies',
    icon: DollarSign,
    color: 'text-yellow-500'
  },
  {
    id: 'betting-results',
    name: 'Results',
    description: 'Discuss match results and outcomes',
    icon: Trophy,
    color: 'text-blue-500'
  }
];

export default function BettingChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnected, onChatMessage, emitChatMessage } = useRealtime();
  const [activeChannel, setActiveChannel] = useState('betting-live');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // TODO: Implement Supabase Realtime for betting chat
    if (isConnected) {
      console.log(`🎰 Joined betting channel: ${activeChannel}`);
    }
  }, [activeChannel, isConnected]);

  useEffect(() => {
    if (!isConnected) return;

    // TODO: Listen for new messages via Supabase Realtime
    const handleNewMessage = (message: any) => {
      if (message.channelId === activeChannel) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, {
            id: message.id,
            content: message.message || message.content,
            senderId: message.userId,
            senderName: message.username,
            senderAvatar: message.avatar,
            senderRole: 'user',
            timestamp: message.timestamp || new Date().toISOString(),
            channelId: message.channelId,
            type: 'text'
          }];
        });
      }
    };

    onChatMessage(handleNewMessage);
  }, [isConnected, activeChannel, onChatMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/messages?channelId=${activeChannel}&limit=50`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send messages",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          channelId: activeChannel,
          content: messageInput.trim()
        })
      });
      
      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      
      if (isConnected && data.message) {
        // TODO: Emit via Supabase Realtime
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
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const currentChannel = bettingChannels.find(c => c.id === activeChannel);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Betting Chat</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
          Discuss live bets, share tips, and analyze results with the community
        </p>
      </div>

      <Card className="h-[calc(100vh-16rem)]">
        <div className="flex h-full">
          {/* Channels Sidebar */}
          <div className="w-64 border-r bg-card/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Channels</h3>
              {isConnected ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">
                  Offline
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {bettingChannels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <Button
                    key={channel.id}
                    variant={activeChannel === channel.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveChannel(channel.id)}
                  >
                    <Icon className={cn("w-4 h-4 mr-2", channel.color)} />
                    <span className="truncate">{channel.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="h-16 border-b bg-card flex items-center px-4">
              <div className="flex items-center gap-3">
                {currentChannel && <currentChannel.icon className={cn("w-5 h-5", currentChannel.color)} />}
                <div>
                  <h3 className="font-semibold">{currentChannel?.name}</h3>
                  <p className="text-sm text-muted-foreground">{currentChannel?.description}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <Hash className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="flex gap-3">
                        <Avatar className="w-8 h-8 mt-0.5">
                          <AvatarImage src={message.senderAvatar} />
                          <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{message.senderName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="text-sm">{message.content}</div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Input */}
            <div className="border-t bg-card p-4">
              {!user ? (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground mb-2">Please log in to send messages</p>
                  <Button size="sm" variant="outline" onClick={() => window.location.href = '/sign-in'}>
                    Login to Chat
                  </Button>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <Input
                      placeholder={`Message #${currentChannel?.name}`}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={loading}
                    />
                    <Button size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8">
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button onClick={handleSendMessage} disabled={!messageInput.trim() || loading}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
