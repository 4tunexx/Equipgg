'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { UserProfileLink } from '@/components/user-profile-link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';

import { Search, Trash2, MessageSquare, AlertTriangle, CheckCircle, XCircle, Edit, Gavel, MicOff } from 'lucide-react';

const moderatorNavItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'supportTickets', label: 'Support Tickets' },
  { id: 'contentMod', label: 'Content Moderation' },
  { id: 'userMod', label: 'User Moderation' },
  { id: 'reports', label: 'Reports' },
];

const recentReports = [
  { id: 1, type: 'Forum Post', content: 'Inappropriate language in post about new update', reporter: { name: 'ShadowHunter', avatar: 'https://picsum.photos/40/40?random=21', dataAiHint: 'player avatar', xp: 1200 }, status: 'Pending', reportedAt: '2 hours ago' },
  { id: 2, type: 'User Profile', content: 'Offensive profile picture', reporter: { name: 'CyberNinja', avatar: 'https://picsum.photos/40/40?random=22', dataAiHint: 'player avatar', xp: 4500 }, status: 'Resolved', reportedAt: '1 day ago' },
  { id: 3, type: 'Chat Message', content: 'Spam links in global chat', reporter: { name: 'QuantumGamer', avatar: 'https://picsum.photos/40/40?random=23', dataAiHint: 'player avatar', xp: 3200 }, status: 'Pending', reportedAt: '3 hours ago' },
  { id: 4, type: 'Forum Thread', content: 'Thread created to harass another player', reporter: { name: 'NeonRider', avatar: 'https://picsum.photos/40/40?random=24', dataAiHint: 'player avatar', xp: 1800 }, status: 'Under Review', reportedAt: '5 hours ago' },
];

const recentForumTopics = [
  { id: 1, title: 'New Update Feedback', author: { name: 'DragonSlayer', avatar: 'https://picsum.photos/40/40?random=25' }, category: 'General Discussion', replies: 24, views: 342, lastPost: '1 hour ago' },
  { id: 2, title: 'Tournament Registration Open', author: { name: 'VortexMaster', avatar: 'https://picsum.photos/40/40?random=26' }, category: 'Tournaments', replies: 18, views: 256, lastPost: '3 hours ago' },
  { id: 3, title: 'Bug in the Arcade Mode', author: { name: 'PhantomGhost', avatar: 'https://picsum.photos/40/40?random=27' }, category: 'Bug Reports', replies: 7, views: 112, lastPost: '5 hours ago' },
];

const chatMessages = [
  { id: 1, user: { name: 'StormRider', avatar: 'https://picsum.photos/40/40?random=28', dataAiHint: 'gamer avatar', xp: 1500 }, message: 'Anyone want to team up for the tournament?', timestamp: '12:45 PM' },
  { id: 2, user: { name: 'FrostByte', avatar: 'https://picsum.photos/40/40?random=29', dataAiHint: 'gamer avatar', xp: 2200 }, message: 'I\'m in! What\'s your rank?', timestamp: '12:47 PM' },
  { id: 3, user: { name: 'LaserShark', avatar: 'https://picsum.photos/40/40?random=30', dataAiHint: 'gamer avatar', xp: 3100 }, message: 'Check out my new inventory items guys!', timestamp: '12:50 PM' },
  { id: 4, user: { name: 'NeonWolf', avatar: 'https://picsum.photos/40/40?random=31', dataAiHint: 'gamer avatar', xp: 2800 }, message: 'The new update is awesome!', timestamp: '12:55 PM' },
];

const users = [
  { id: 1, name: 'CyberNinja', avatar: 'https://picsum.photos/40/40?random=22', status: 'Active', lastSeen: '2 minutes ago', xp: 4500, role: 'User', dataAiHint: 'player avatar' },
  { id: 2, name: 'QuantumGamer', avatar: 'https://picsum.photos/40/40?random=23', status: 'Active', lastSeen: '5 minutes ago', xp: 3200, role: 'VIP', dataAiHint: 'player avatar' },
  { id: 3, name: 'NeonRider', avatar: 'https://picsum.photos/40/40?random=24', status: 'Inactive', lastSeen: '2 days ago', xp: 1800, role: 'User', dataAiHint: 'player avatar' },
];

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  user_name: string;
  user_email: string;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

interface TicketReply {
  id: string;
  message: string;
  user_name: string;
  user_role: string;
  is_internal: boolean;
  created_at: string;
}

export default function ModeratorDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeNav, setActiveNav] = React.useState('overview');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [supportTickets, setSupportTickets] = React.useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = React.useState<SupportTicket | null>(null);
  const [ticketReplies, setTicketReplies] = React.useState<TicketReply[]>([]);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = React.useState(false);
  const [newReply, setNewReply] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  
  // Check if user is a moderator or admin
  React.useEffect(() => {
    if (user && user.role !== 'moderator' && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the moderator panel.",
        variant: "destructive"
      });
      // Note: We don't redirect here as the layout handles navigation
    }
  }, [user, toast]);

  // Fetch support tickets when component mounts or when support tickets tab is active
  React.useEffect(() => {
    if (activeNav === 'supportTickets') {
      fetchSupportTickets();
    }
  }, [activeNav]);

  const fetchSupportTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/support/tickets');
      if (response.ok) {
        const data = await response.json();
        setSupportTickets(data.tickets || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch support tickets",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch support tickets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTicket(data.ticket);
        setTicketReplies(data.replies || []);
        setIsTicketDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch ticket details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ticket details",
        variant: "destructive"
      });
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Ticket status updated successfully",
        });
        fetchSupportTickets(); // Refresh tickets
        if (selectedTicket?.id === ticketId) {
          fetchTicketDetails(ticketId); // Refresh current ticket details
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to update ticket status",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive"
      });
    }
  };

  const handleAddReply = async () => {
    if (!selectedTicket || !newReply.trim()) return;

    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newReply.trim(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Reply added successfully",
        });
        setNewReply('');
        fetchTicketDetails(selectedTicket.id); // Refresh ticket details
        fetchSupportTickets(); // Refresh tickets list
      } else {
        toast({
          title: "Error",
          description: "Failed to add reply",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      toast({
        title: "Error",
        description: "Failed to add reply",
        variant: "destructive"
      });
    }
  };
  
  // Don't render anything if user is not moderator or admin
  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You don't have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleReportAction = (reportId: number, action: string) => {
    toast({
      title: `Report ${action}`,
      description: `Report #${reportId} has been ${action.toLowerCase()}.`,
    });
  };

  const handleDeleteContent = (contentId: number, contentType: string) => {
    toast({
      title: 'Content Deleted',
      description: `${contentType} has been removed.`,
      variant: 'destructive',
    });
  };

  const handleUserAction = (userId: number, action: string) => {
    toast({
      title: `User ${action}`,
      description: `Action applied successfully.`,
    });
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Moderator Dashboard</h1>
          <p className="text-muted-foreground">Manage community content and user interactions</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {moderatorNavItems.map((item) => (
            <Button 
              key={item.id}
              variant={activeNav === item.id ? 'default' : 'outline'}
              onClick={() => setActiveNav(item.id)}
              className="min-w-24"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {activeNav === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Latest user-submitted reports requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReports.slice(0, 3).map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="font-medium">{report.type}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">{report.content}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.status === 'Resolved' ? 'outline' : 'default'} 
                          className={cn(
                            report.status === 'Pending' && 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
                            report.status === 'Under Review' && 'bg-blue-500/20 text-blue-500 border-blue-500/30',
                            report.status === 'Resolved' && 'bg-green-500/20 text-green-500 border-green-500/30'
                          )}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleReportAction(report.id, 'Resolved')}>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleReportAction(report.id, 'Dismissed')}>
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setActiveNav('reports')}>
                View All Reports
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Moderation Activity</CardTitle>
              <CardDescription>Your recent moderation actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Reports Handled Today</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Content Removed</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
                <div>
                  <p className="text-sm font-medium">User Warnings</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Recent Actions</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                    <span>Removed inappropriate forum post</span>
                    <span className="text-xs text-muted-foreground">10 min ago</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                    <span>Issued warning to user PhantomGhost</span>
                    <span className="text-xs text-muted-foreground">1 hour ago</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                    <span>Resolved report #1042</span>
                    <span className="text-xs text-muted-foreground">3 hours ago</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeNav === 'supportTickets' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>Manage user support requests and provide assistance</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading tickets...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supportTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono">{ticket.id.slice(0, 8)}...</TableCell>
                        <TableCell className="font-medium">{ticket.subject}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ticket.user_name}</div>
                            <div className="text-sm text-muted-foreground">{ticket.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{ticket.category}</TableCell>
                        <TableCell>
                          <Badge variant={
                            ticket.status === 'open' ? 'destructive' :
                            ticket.status === 'in_progress' ? 'secondary' :
                            ticket.status === 'resolved' ? 'default' : 'outline'
                          }>
                            {ticket.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Select
                              value={ticket.status}
                              onValueChange={(value) => updateTicketStatus(ticket.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchTicketDetails(ticket.id)}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Ticket Details Dialog */}
          <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ticket Details</DialogTitle>
                <DialogDescription>
                  {selectedTicket?.subject}
                </DialogDescription>
              </DialogHeader>
              
              {selectedTicket && (
                <div className="space-y-6">
                  {/* Ticket Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div>
                        <Badge variant={
                          selectedTicket.status === 'open' ? 'destructive' :
                          selectedTicket.status === 'in_progress' ? 'secondary' :
                          selectedTicket.status === 'resolved' ? 'default' : 'outline'
                        }>
                          {selectedTicket.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <div>{selectedTicket.category}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">User</Label>
                      <div>
                        <div className="font-medium">{selectedTicket.user_name}</div>
                        <div className="text-sm text-muted-foreground">{selectedTicket.user_email}</div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <div>{new Date(selectedTicket.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      {selectedTicket.description}
                    </div>
                  </div>

                  {/* Replies */}
                  <div>
                    <Label className="text-sm font-medium">Conversation</Label>
                    <div className="mt-2 space-y-4 max-h-60 overflow-y-auto">
                      {ticketReplies.map((reply) => (
                        <div key={reply.id} className={`p-3 rounded-lg ${
                          reply.is_internal ? 'bg-yellow-50 border border-yellow-200' : 'bg-muted'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-sm">
                              {reply.user_name}
                              {reply.is_internal && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Internal Note
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(reply.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-sm">{reply.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Reply */}
                  <div>
                    <Label className="text-sm font-medium">Add Reply</Label>
                    <div className="mt-2 space-y-2">
                      <Textarea
                        placeholder="Type your reply here..."
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        rows={3}
                      />
                      <Button onClick={handleAddReply} disabled={!newReply.trim()}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Add Reply
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {activeNav === 'contentMod' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Forum Content</CardTitle>
              <CardDescription>Review and moderate forum posts and threads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Input 
                  id="forum-search"
                  name="forum-search"
                  placeholder="Search forum content..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="max-w-sm" 
                />
                <Button><Search className="w-4 h-4 mr-2" />Search</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Topic</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentForumTopics.map((topic) => (
                    <TableRow key={topic.id}>
                      <TableCell>
                        <div className="font-medium">{topic.title}</div>
                        <div className="text-xs text-muted-foreground">{topic.replies} replies · {topic.views} views</div>
                      </TableCell>
                      <TableCell>
                        <UserProfileLink user={{...topic.author, dataAiHint: 'player avatar', xp: 1500}} />
                      </TableCell>
                      <TableCell>{topic.category}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Moderate Topic: {topic.title}</DialogTitle>
                              <DialogDescription>
                                Review and moderate this forum topic.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Moderation Action</Label>
                                <Select>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select action..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="warn">Warn Author</SelectItem>
                                    <SelectItem value="hide">Hide Topic</SelectItem>
                                    <SelectItem value="delete">Delete Topic</SelectItem>
                                    <SelectItem value="move">Move to Different Category</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Reason</Label>
                                <Textarea placeholder="Explain the reason for this moderation action..." />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button>Apply Action</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteContent(topic.id, 'Forum topic')}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chat Moderation</CardTitle>
              <CardDescription>Monitor and moderate live chat messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 mb-4 h-64 overflow-y-auto space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3">
                    <UserProfileLink user={{...msg.user, dataAiHint: '', xp: 0}} />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm">{msg.message}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteContent(msg.id, 'Chat message')}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </Button>
                <Button variant="destructive" size="sm">
                  Clear Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeNav === 'userMod' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Search and moderate user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Input 
                  id="users-search"
                  name="users-search"
                  placeholder="Search users..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="max-w-sm" 
                />
                <Button><Search className="w-4 h-4 mr-2" />Search</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <UserProfileLink user={{...user, id: user.id.toString()}} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'Active' ? 'default' : 'outline'} 
                          className={cn(user.status === 'Active' && 'bg-green-500/20 text-green-500 border-green-500/30')}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleUserAction(user.id, 'Muted')}>
                          <MicOff className="h-4 w-4 text-yellow-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleUserAction(user.id, 'Warned')}>
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Gavel className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Moderate User: {user.name}</DialogTitle>
                              <DialogDescription>
                                Review and moderate this user's activity.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Moderation Action</Label>
                                <Select>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select action..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="warn">Issue Warning</SelectItem>
                                    <SelectItem value="mute">Mute User (24h)</SelectItem>
                                    <SelectItem value="suspend">Suspend Account (7 days)</SelectItem>
                                    <SelectItem value="ban">Ban Account</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Reason</Label>
                                <Textarea placeholder="Explain the reason for this moderation action..." />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button>Apply Action</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeNav === 'reports' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Reports</CardTitle>
              <CardDescription>Review and handle user-submitted reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Input 
                    id="reports-search"
                    name="reports-search"
                    placeholder="Search reports..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="max-w-sm" 
                  />
                  <Button><Search className="w-4 h-4 mr-2" />Search</Button>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="review">Under Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="font-medium">{report.type}</div>
                        <div className="text-sm text-muted-foreground">{report.content}</div>
                      </TableCell>
                      <TableCell>
                        <UserProfileLink user={report.reporter} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.status === 'Resolved' ? 'outline' : 'default'} 
                          className={cn(
                            report.status === 'Pending' && 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
                            report.status === 'Under Review' && 'bg-blue-500/20 text-blue-500 border-blue-500/30',
                            report.status === 'Resolved' && 'bg-green-500/20 text-green-500 border-green-500/30'
                          )}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{report.reportedAt}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Review Report #{report.id}</DialogTitle>
                              <DialogDescription>{report.type}: {report.content}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Change Status</Label>
                                <Select defaultValue={report.status.toLowerCase().replace(' ', '-')}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="under-review">Under Review</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Moderator Notes</Label>
                                <Textarea placeholder="Add notes about this report..." />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={() => handleReportAction(report.id, 'Updated')}>Save Changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={() => handleReportAction(report.id, 'Resolved')}>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleReportAction(report.id, 'Dismissed')}>
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Previous</Button>
              <Button variant="outline">Next</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}