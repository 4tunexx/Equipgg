
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { useAuth } from "../../../hooks/use-auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { UserProfileLink } from "../../../components/user-profile-link";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { getRoleColors } from "../../../lib/role-colors";
import { MessageSquare, Plus, Minus, ArrowRight, MessageCircle, PenSquare } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { useToast } from "../../../hooks/use-toast";

// Dynamically import the full chat page component
const ChatPageContent = dynamic(() => import('../chat/page'), { ssr: false });

interface ForumCategory {
  id: string;
  title?: string;
  name?: string;
  description: string;
  icon?: React.ComponentType<{className?: string}> | string;
  topics?: number;
  topicCount?: number;
  posts?: number;
  postCount?: number;
}

interface RecentTopic {
  id: string;
  title: string;
  category: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    [key: string]: unknown;
  };
  replies: number;
  rep?: number;
  views?: number;
  lastActivity?: string;
}

interface ForumData {
  categories: ForumCategory[];
  recentTopics: RecentTopic[];
}

export default function CommunityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [forumData, setForumData] = useState<ForumData>({ categories: [], recentTopics: [] });
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '', categoryId: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchForumData();
  }, []);

  const fetchForumData = async () => {
    try {
      const response = await fetch('/api/forum');
      if (response.ok) {
        const data = await response.json();
        setForumData(data);
      } else {
        setForumData({ categories: [], recentTopics: [] });
      }
    } catch (error) {
      console.error('Failed to fetch forum data:', error);
      setForumData({ categories: [], recentTopics: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create topics",
        variant: "destructive"
      });
      return;
    }

    if (!newTopic.title.trim() || !newTopic.content.trim() || !newTopic.categoryId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newTopic.title.trim(),
          content: newTopic.content.trim(),
          categoryId: newTopic.categoryId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create topic');
      }

      toast({
        title: "Success!",
        description: "Your topic has been created"
      });

      setCreateDialogOpen(false);
      setNewTopic({ title: '', content: '', categoryId: '' });
      fetchForumData(); // Refresh the forum data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create topic. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-headline">Community Hub</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
            Loading community data...
          </p>
        </div>
      </div>
    );
  }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                    <h1 className="text-3xl font-bold font-headline">Community Hub</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
                        Connect with other players, get support, share ideas, and trade items in our forums.
                    </p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PenSquare className="mr-2 h-4 w-4" />
                            Create Topic
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Create New Topic</DialogTitle>
                            <DialogDescription>
                                Start a new discussion in the community forums
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Select value={newTopic.categoryId} onValueChange={(value) => setNewTopic(prev => ({ ...prev, categoryId: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {forumData.categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name || cat.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input
                                    placeholder="Enter topic title..."
                                    value={newTopic.title}
                                    onChange={(e) => setNewTopic(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Content</label>
                                <Textarea
                                    placeholder="Write your post content..."
                                    value={newTopic.content}
                                    onChange={(e) => setNewTopic(prev => ({ ...prev, content: e.target.value }))}
                                    rows={6}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateTopic} disabled={submitting}>
                                {submitting ? 'Creating...' : 'Create Topic'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="forums" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="grid grid-cols-2 w-full max-w-md">
                        <TabsTrigger value="forums"><MessageSquare className="mr-2"/>Forums</TabsTrigger>
                        <TabsTrigger value="chat"><MessageCircle className="mr-2"/>Chat</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="forums" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {forumData.categories.map((category) => (
                            <Link href="/dashboard/community/forum" key={category.id}>
                                <Card className="bg-card/50 hover:border-primary/50 transition-colors group h-full">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3">
                                            <span>{typeof category.icon === 'string' ? category.icon : category.icon ? <category.icon className="w-5 h-5" /> : '💬'}</span>
                                            <span>{category.name || category.title}</span>
                                        </CardTitle>
                                        <CardDescription>{category.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm text-muted-foreground">
                                            <p><strong>Topics:</strong> {(category.topicCount || category.topics || 0).toLocaleString()}</p>
                                            <p><strong>Posts:</strong> {(category.postCount || category.posts || 0).toLocaleString()}</p>
                                        </div>
                                        <Button variant="ghost" className="mt-4 w-full justify-start p-0 h-auto text-primary">
                                            Enter Forum <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Topics</CardTitle>
                            <CardDescription>Check out the latest conversations happening in the community.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Topic</TableHead>
                                        <TableHead>Author</TableHead>
                                        <TableHead className="text-center">Replies</TableHead>
                                        <TableHead className="text-center">Reputation</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {forumData.recentTopics.map((topic) => (
                                        <TableRow key={topic.id}>
                                            <TableCell>
                                                <p className="font-semibold text-base">{topic.title}</p>
                                                <p className="text-xs text-muted-foreground">in <span className="text-primary">{topic.category}</span></p>
                                            </TableCell>
                                            <TableCell>
                                                <UserProfileLink user={{
                                                    name: topic.author.displayName,
                                                    avatar: topic.author.avatarUrl,
                                                    role: 'player',
                                                    dataAiHint: topic.author.displayName,
                                                    xp: 0
                                                }} />
                                            </TableCell>
                                            <TableCell className="text-center text-muted-foreground">{topic.replies}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="outline" size="icon" className="w-8 h-8">
                                                        <Plus className="w-4 h-4 text-green-500" />
                                                    </Button>
                                                    <span className="font-bold text-lg">{topic.rep}</span>
                                                    <Button variant="outline" size="icon" className="w-8 h-8">
                                                        <Minus className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="chat">
                    <ChatPageContent />
                </TabsContent>
            </Tabs>
        </div>
    );
}
