
'use client';


import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserProfileLink } from "./user-profile-link";
import { useAuth } from "./auth-provider";
import { useEffect, useRef, useState } from "react";
import { getRoleColors } from "@/lib/role-colors";

type LiveChatProps = {
    title: string;
};

// Use static timestamps to prevent hydration mismatches
const fallbackMessages = [
    { id: 'fallback-1', user: { rank: 1, name: 'Admin', avatar: 'https://picsum.photos/32/32?random=31', dataAiHint: 'gamer avatar', xp: 100, role: 'admin' }, message: 'Welcome to the chat! 🎉', timestamp: '2024-01-15T12:00:00Z' },
    { id: 'fallback-2', user: { rank: 2, name: 'Moderator', avatar: 'https://picsum.photos/32/32?random=32', dataAiHint: 'player avatar', xp: 200, role: 'moderator' }, message: 'Good luck have fun!', timestamp: '2024-01-15T12:01:00Z' },
    { id: 'fallback-3', user: { rank: 3, name: 'User3', avatar: 'https://picsum.photos/32/32?random=33', dataAiHint: 'gaming profile', xp: 300, role: 'user' }, message: 'What a play!', timestamp: '2024-01-15T12:02:00Z' },
    { id: 'fallback-4', user: { rank: 4, name: 'User4', avatar: 'https://picsum.photos/32/32?random=34', dataAiHint: 'user avatar', xp: 400, role: 'user' }, message: 'I believe in them', timestamp: '2024-01-15T12:03:00Z' },
    { id: 'fallback-5', user: { rank: 5, name: 'User5', avatar: 'https://picsum.photos/32/32?random=35', dataAiHint: 'esports fan', xp: 500, role: 'user' }, message: 'This is intense!', timestamp: '2024-01-15T12:04:00Z' },
];

export function LiveChat({ title }: LiveChatProps) {
    const { user } = useAuth();
    const [input, setInput] = useState('');
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
                const response = await fetch('/api/chat?limit=50');
                if (response.ok) {
                    const data = await response.json();
                    // Map API response to expected format
                    const mappedMessages = (data.messages || []).map((msg: any, index: number) => ({
                        id: `api-${msg.id || index}`,
                        user: {
                            rank: Number(msg.rank) || 0,
                            name: String(msg.username) || 'Unknown',
                            avatar: String(msg.avatar) || 'https://picsum.photos/32/32?random=99',
                            role: String(msg.role) || 'user',
                            dataAiHint: 'user avatar',
                            xp: Number(msg.level) || 0,
                        },
                        message: String(msg.content),
                        timestamp: String(msg.timestamp) || new Date().toISOString(),
                    }));
                    setMessages(mappedMessages);
                } else {
                    // Fallback to mock messages if API fails
                    setMessages(fallbackMessages);
                }
            } catch (error) {
                console.error('Failed to fetch chat messages:', error);
                // Fallback to mock messages on error
                setMessages(fallbackMessages);
            }
        };

        fetchMessages();
    }, [title]);

    useEffect(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

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
                body: JSON.stringify({ content: messageContent }),
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.message) {
                    // Add the new message to the local state
                    setMessages(prev => [...prev, {
                        id: `sent-${data.message.id || Date.now()}`,
                        user: {
                            rank: data.message.rank || 0,
                            name: data.message.username,
                            avatar: data.message.avatar || 'https://picsum.photos/32/32?random=99',
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
                        name: user.displayName || user.email,
                        avatar: user.photoURL || 'https://picsum.photos/32/32?random=99',
                        role: user.role || 'user',
                        dataAiHint: 'user avatar',
                        xp: 0,
                    } : fallbackMessages[0].user,
                    message: messageContent,
                    timestamp: new Date().toISOString(),
                };
                setMessages(prev => [...prev, fallbackMsg]);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            // Add message locally as fallback
            const fallbackMsg = {
                id: `error-${Date.now()}`,
                user: user ? {
                    rank: 0,
                    name: user.displayName || user.email,
                    avatar: user.photoURL || 'https://picsum.photos/32/32?random=99',
                    role: user.role || 'user',
                    dataAiHint: 'user avatar',
                    xp: 0,
                } : fallbackMessages[0].user,
                message: messageContent,
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, fallbackMsg]);
        }
    };

    return (
        <div className="flex flex-col h-full p-4">
            <h2 className="text-xl font-bold mb-4 px-2">{title}</h2>
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
                <Input placeholder="Type a message..." className="flex-1" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }} />
                <Button size="icon" onClick={sendMessage} disabled={!input.trim()}>
                <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}
