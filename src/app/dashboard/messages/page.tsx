'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Badge } from "../../../components/ui/badge";
import { useAuth } from "../../../hooks/use-auth";
import { useToast } from "../../../hooks/use-toast";
import { 
  MessageSquare, 
  Send, 
  Inbox, 
  Search,
  Clock,
  CheckCheck,
  Crown,
  Shield
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender?: {
    id: string;
    username: string;
    displayname: string;
    avatar_url?: string;
    role: string;
  };
}

interface Conversation {
  userId: string;
  username: string;
  displayname: string;
  avatar_url?: string;
  role: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/messages', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Group messages by conversation
        const conversationMap = new Map<string, Conversation>();
        
        data.messages.forEach((message: Message) => {
          // Determine the other user in the conversation
          const otherUserId = message.sender_id === user?.id ? message.receiver_id : message.sender_id;
          const otherUser = message.sender_id === user?.id ? null : message.sender;
          
          if (!conversationMap.has(otherUserId)) {
            conversationMap.set(otherUserId, {
              userId: otherUserId,
              username: otherUser?.username || 'Unknown',
              displayname: otherUser?.displayname || otherUser?.username || 'Unknown User',
              avatar_url: otherUser?.avatar_url,
              role: otherUser?.role || 'user',
              lastMessage: message.content,
              lastMessageTime: message.created_at,
              unreadCount: 0,
              messages: []
            });
          }
          
          const conversation = conversationMap.get(otherUserId)!;
          conversation.messages.push(message);
          
          // Update unread count
          if (!message.read && message.receiver_id === user?.id) {
            conversation.unreadCount++;
          }
          
          // Update last message if this is more recent
          if (new Date(message.created_at) > new Date(conversation.lastMessageTime)) {
            conversation.lastMessage = message.content;
            conversation.lastMessageTime = message.created_at;
          }
        });
        
        // Convert to array and sort by last message time
        const conversationsArray = Array.from(conversationMap.values()).sort((a, b) => 
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
        
        setConversations(conversationsArray);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: selectedConversation.userId,
          content: messageInput.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add message to conversation
        const newMessage: Message = {
          id: data.message.id,
          sender_id: user!.id,
          receiver_id: selectedConversation.userId,
          content: messageInput.trim(),
          created_at: new Date().toISOString(),
          read: false
        };
        
        setConversations(prev => prev.map(conv => {
          if (conv.userId === selectedConversation.userId) {
            return {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: newMessage.content,
              lastMessageTime: newMessage.created_at
            };
          }
          return conv;
        }));
        
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, newMessage]
        } : null);
        
        setMessageInput('');
        
        toast({
          title: "Message sent",
          description: "Your message has been delivered"
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-red-500" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.displayname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl h-[calc(100vh-200px)]">
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Messages
          </h1>
          <p className="text-muted-foreground">Direct messages from admins, moderators, and users</p>
        </div>

        <Card className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Conversations List */}
            <div className="border-r flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">Conversations</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="px-4 pb-4 space-y-2">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-8">
                      <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No messages yet</p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <button
                        key={conversation.userId}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedConversation?.userId === conversation.userId
                            ? 'bg-primary/10 border border-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarImage src={conversation.avatar_url} />
                            <AvatarFallback>{conversation.displayname[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold truncate">{conversation.displayname}</span>
                              {getRoleIcon(conversation.role)}
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="ml-auto">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Message Thread */}
            <div className="md:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={selectedConversation.avatar_url} />
                        <AvatarFallback>{selectedConversation.displayname[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {selectedConversation.displayname}
                          {getRoleIcon(selectedConversation.role)}
                        </CardTitle>
                        <CardDescription>@{selectedConversation.username}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {selectedConversation.messages
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((message) => {
                          const isMe = message.sender_id === user?.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  isMe
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                <div className={`flex items-center gap-1 mt-1 text-xs ${
                                  isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                }`}>
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                  {isMe && message.read && (
                                    <CheckCheck className="h-3 w-3 ml-1" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </ScrollArea>

                  <CardContent className="border-t pt-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        className="min-h-[60px] resize-none"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!messageInput.trim() || sending}
                        size="icon"
                        className="h-[60px] w-[60px]"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                  </CardContent>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
                    <p className="text-sm text-muted-foreground">
                      Select a conversation from the list to view messages
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

