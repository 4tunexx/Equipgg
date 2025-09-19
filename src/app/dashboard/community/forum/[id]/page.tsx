'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Textarea } from "../../../../../components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../../components/ui/avatar";
import { Badge } from "../../../../../components/ui/badge";
import { useAuth } from "../../../../../hooks/use-auth";
import { useToast } from "../../../../../hooks/use-toast";
import { ArrowLeft, MessageSquare, Heart, Flag, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    role: string;
    xp: number;
    level: number;
  };
  category: string;
  views: number;
  replies: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isLocked: boolean;
}

interface ForumReply {
  id: string;
  content: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    role: string;
    xp: number;
    level: number;
  };
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export default function ForumPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const postId = params.id as string;

  useEffect(() => {
    fetchPost();
    fetchReplies();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      } else if (response.status === 404) {
        toast({
          title: "Post Not Found",
          description: "The forum post you're looking for doesn't exist.",
          variant: "destructive"
        });
        router.push('/dashboard/community');
      } else {
        throw new Error('Failed to fetch post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({
        title: "Error",
        description: "Failed to load forum post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const response = await fetch(`/api/forum/posts/${postId}/replies`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setReplies(data.replies);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Reply content cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    setSubmittingReply(true);
    try {
      const response = await fetch(`/api/forum/posts/${postId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          content: replyContent
        })
      });

      if (response.ok) {
        setReplyContent('');
        fetchReplies(); // Refresh replies
        toast({
          title: "Success",
          description: "Your reply has been posted!"
        });
      } else {
        throw new Error('Failed to submit reply');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast({
        title: "Error",
        description: "Failed to submit reply. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleLikePost = async () => {
    try {
      const response = await fetch(`/api/forum/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        fetchPost(); // Refresh post to update like count
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Post Not Found</h2>
              <p className="text-muted-foreground mb-4">The forum post you're looking for doesn't exist.</p>
              <Link href="/dashboard/community">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Community
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/community">
        <Button variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Community
        </Button>
      </Link>

      {/* Main Post */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{post.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{post.category}</Badge>
                {post.isPinned && <Badge variant="default">Pinned</Badge>}
                {post.isLocked && <Badge variant="destructive">Locked</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleLikePost}>
                <Heart className="w-4 h-4 mr-1" />
                {post.likes}
              </Button>
              <Button variant="ghost" size="sm">
                <Flag className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src={post.author.avatarUrl} />
              <AvatarFallback>{post.author.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{post.author.displayName}</span>
                <Badge variant="outline">{post.author.role}</Badge>
                <span className="text-sm text-muted-foreground">Level {post.author.level}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{post.content}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replies Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Replies ({replies.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {replies.map((reply) => (
            <div key={reply.id} className="border-l-2 border-muted pl-4">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={reply.author.avatarUrl} />
                  <AvatarFallback>{reply.author.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{reply.author.displayName}</span>
                    <Badge variant="outline">{reply.author.role}</Badge>
                    <span className="text-sm text-muted-foreground">Level {reply.author.level}</span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{reply.content}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="ghost" size="sm">
                      <Heart className="w-4 h-4 mr-1" />
                      {reply.likes}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Flag className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reply Form */}
      {user && !post.isLocked && (
        <Card>
          <CardHeader>
            <CardTitle>Post a Reply</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end">
                <Button onClick={handleSubmitReply} disabled={submittingReply}>
                  {submittingReply ? "Posting..." : "Post Reply"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!user && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Please sign in to post a reply.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}