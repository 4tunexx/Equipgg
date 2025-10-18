
'use client';

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send, Minimize2, Maximize2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { UserProfileLink } from "./user-profile-link";
import { useAuth } from "./auth-provider";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../hooks/use-toast";
import { useSocket } from "../contexts/socket-context";


type LiveChatProps = {
    title: string;
    lobby: string;
};

// No fallback messages - start with empty chat
const fallbackMessages = [];

export function LiveChat({ title, lobby }: LiveChatProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const { socket, isConnected } = useSocket();
    const [input, setInput] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    interface ChatMessage {
        id: string;
        user: {
            rank: number;
            name: string;
            avatar: string;
            role?: string;
        };
        message: string;
        timestamp: string;
    }

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await fetch(`/api/chat?limit=50&lobby=${encodeURIComponent(lobby)}`);
                if (response.ok) {
                    const data = await response.json();
                    // Map API response to expected format
                    const mappedMessages = (data.messages || []).map((msg: { id: string; rank: number; username: string; avatar: string; role: string; content: string; timestamp: string; level: number }, index: number) => ({
                        id: `api-${msg.id || index}`,
                        user: {
                            rank: Number(msg.rank) || 0,
                            name: String(msg.username) || 'Unknown',
                            avatar: String(msg.avatar) || null,
                            role: String(msg.role) || 'user',
                            dataAiHint: 'user avatar',
                            xp: Number(msg.level) || 0,
                        },
                        message: String(msg.content),
                        timestamp: String(msg.timestamp) || new Date().toISOString(),
                    }));
                    setMessages(mappedMessages);
                } else {
                    // Start with empty chat if API fails
                    setMessages([]);
                }
            } catch (error) {
                console.error('Failed to fetch chat messages:', error);
                // Start with empty chat on error
                setMessages([]);
            }
        };

        fetchMessages();
    }, [title, lobby]);

    useEffect(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    // Socket.IO real-time chat
    useEffect(() => {
        if (!socket || !isConnected) return;

        // Join the lobby room
        socket.emit('join-lobby', lobby);
        console.log(`🔌 Joined chat lobby: ${lobby}`);

        // Listen for new messages
        const handleNewMessage = (message: any) => {
            console.log('📨 Received new message:', message);
            setMessages(prev => [...prev, {
                id: `socket-${message.id || Date.now()}`,
                user: {
                    rank: message.rank || 0,
                    name: message.username || 'Anonymous',
                    avatar: message.avatar || null,
                    role: message.role || 'user',
                },
                message: message.content,
                timestamp: message.timestamp || new Date().toISOString(),
            }]);
        };

        socket.on('chat-message', handleNewMessage);

        return () => {
            socket.off('chat-message', handleNewMessage);
            socket.emit('leave-lobby', lobby);
        };
    }, [socket, isConnected, lobby]);

    const sendMessage = async () => {
        if (!input.trim()) return;
        
        const messageContent = input.trim();
        setInput(''); // Clear input immediately for better UX
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: messageContent, lobby }),
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.message) {
                    // Emit message via Socket.IO for real-time delivery to other users
                    if (socket && isConnected) {
                        socket.emit('send-chat-message', {
                            lobby,
                            ...data.message
                        });
                    }
                    
                    // Add the new message to the local state
                    setMessages(prev => [...prev, {
                        id: `sent-${data.message.id || Date.now()}`,
                        user: {
                            rank: data.message.rank || 0,
                            name: data.message.username,
                            avatar: data.message.avatar || null,
                            role: data.message.role || 'user',
                            dataAiHint: 'user avatar',
                            xp: data.message.level || 0,
                        },
                        message: data.message.content,
                        timestamp: data.message.timestamp || new Date().toISOString(),
                    }]);
                }
            } else {
                // If API fails, add message locally as fallback
                const fallbackMsg = {
                    id: `fallback-${Date.now()}`,
                    user: user ? {
                        rank: 0,
                        name: (user as any).displayName || (user as any).email || 'Anonymous',
                        avatar: (user as any).photoURL || (user as any).avatar_url || null,
                        role: (user as any).role || 'user',
                        dataAiHint: 'user avatar',
                        xp: 0,
                    } : {
                        rank: 0,
                        name: 'Anonymous',
                        avatar: null,
                        role: 'user',
                        dataAiHint: 'user avatar',
                        xp: 0,
                    },
                    message: messageContent,
                    timestamp: new Date().toISOString(),
                };
                setMessages(prev => [...prev, fallbackMsg]);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            // Don't add fallback message on error - let user retry
            toast({
                title: "Failed to send message",
                description: "Please try again",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Mobile Minimize Header */}
            <div className="md:hidden flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold">{title}</h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1"
                >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
            </div>

            {/* Minimized state for mobile */}
            {isMinimized && (
                <div className="md:hidden flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                        <p className="text-muted-foreground mb-2">Chat minimized</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsMinimized(false)}
                        >
                            <Maximize2 className="w-4 h-4 mr-2" />
                            Open Chat
                        </Button>
                    </div>
                </div>
            )}

            {/* Full chat interface */}
            {!isMinimized && (
                <div className="flex flex-col h-full p-4">
                    {/* Desktop title */}
                    <h2 className="hidden md:block text-xl font-bold mb-4 px-2">{title}</h2>
                    
                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4" ref={scrollRef}>
                        {messages.map((msg) => {
                            const extendedUser = {
                                ...msg.user,
                                dataAiHint: 'chat user avatar',
                                xp: 0
                            };
                            return (
                             <div key={msg.id} className="flex items-start gap-3">
                                <UserProfileLink user={extendedUser} avatarOnly={true} />
                                <div className="flex flex-col">
                                    <UserProfileLink user={extendedUser} hideAvatar={true} />
                                    <p className="text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg mt-1">{msg.message}</p>
                                </div>
                            </div>
                            );
                        })}
                        </div>
                    </ScrollArea>
                    
                    <div className="mt-4 flex items-center gap-2">
                        <Input 
                            placeholder="Type a message..." 
                            className="flex-1" 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }} 
                        />
                        <Button size="icon" onClick={sendMessage} disabled={!input.trim()}>
                        <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
