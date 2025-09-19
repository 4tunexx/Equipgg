'use client';

import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Textarea } from "../../../components/ui/textarea";
import { PlusCircle, MessageSquare, Eye } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { cn } from "../../../lib/utils";
import { toast } from "sonner";

interface Ticket {
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

export default function SupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [ticketReplies, setTicketReplies] = useState<TicketReply[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
    const [newReply, setNewReply] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch tickets on component mount
    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const response = await fetch('/api/support/tickets');
            if (response.ok) {
                const data = await response.json();
                setTickets(data.tickets || []);
            } else {
                toast.error('Failed to fetch tickets');
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
            toast.error('Failed to fetch tickets');
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
                toast.error('Failed to fetch ticket details');
            }
        } catch (error) {
            console.error('Error fetching ticket details:', error);
            toast.error('Failed to fetch ticket details');
        }
    };

    const handleCreateTicket = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
        try {
            const response = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject: formData.get('subject'),
                    description: formData.get('description'),
                    category: formData.get('category'),
                }),
            });

            if (response.ok) {
                toast.success('Support ticket created successfully!');
                setIsDialogOpen(false);
                fetchTickets(); // Refresh the tickets list
                // Reset form
                (event.target as HTMLFormElement).reset();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to create ticket');
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast.error('Failed to create ticket');
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
                toast.success('Reply added successfully!');
                setNewReply('');
                fetchTicketDetails(selectedTicket.id); // Refresh ticket details
                fetchTickets(); // Refresh tickets list
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to add reply');
            }
        } catch (error) {
            console.error('Error adding reply:', error);
            toast.error('Failed to add reply');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'destructive';
            case 'in_progress': return 'secondary';
            case 'resolved': return 'default';
            case 'closed': return 'outline';
            default: return 'secondary';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'open': return 'Open';
            case 'in_progress': return 'In Progress';
            case 'resolved': return 'Resolved';
            case 'closed': return 'Closed';
            default: return status;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };
    
    const renderTicketsTable = (filteredTickets: Ticket[]) => {
        if (loading) {
            return <div className="text-center py-8">Loading tickets...</div>;
        }

        if (filteredTickets.length === 0) {
            return <div className="text-center py-8 text-muted-foreground">No tickets found</div>;
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ticket ID</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredTickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                            <TableCell className="font-mono">{ticket.id.slice(0, 8)}...</TableCell>
                            <TableCell className="font-medium">{ticket.subject}</TableCell>
                            <TableCell>{ticket.category}</TableCell>
                            <TableCell>{formatDate(ticket.created_at)}</TableCell>
                            <TableCell className="text-right">
                                <Badge variant={getStatusColor(ticket.status)}>
                                    {getStatusText(ticket.status)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchTicketDetails(ticket.id)}
                                >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Support Center</h1>
                    <p className="text-muted-foreground mt-1">Create and manage your support tickets here.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2"/>
                            Create New Ticket
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create a New Support Ticket</DialogTitle>
                            <DialogDescription>
                                Describe your issue below and our support team will get back to you as soon as possible.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateTicket}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input id="subject" name="subject" placeholder="e.g., Missing item from inventory" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select name="category" required>
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="General">General</SelectItem>
                                            <SelectItem value="Billing">Billing & Payments</SelectItem>
                                            <SelectItem value="Technical">Technical Issue</SelectItem>
                                            <SelectItem value="Account">Account Help</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" name="description" placeholder="Please describe your issue in detail..." rows={6} required />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Submit Ticket</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Your Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all">
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="open">Open</TabsTrigger>
                            <TabsTrigger value="resolved">Resolved</TabsTrigger>
                        </TabsList>
                        <TabsContent value="all" className="mt-4">
                            {renderTicketsTable(tickets)}
                        </TabsContent>
                        <TabsContent value="open" className="mt-4">
                            {renderTicketsTable(tickets.filter(t => t.status === 'open' || t.status === 'in_progress'))}
                        </TabsContent>
                        <TabsContent value="resolved" className="mt-4">
                            {renderTicketsTable(tickets.filter(t => t.status === 'resolved' || t.status === 'closed'))}
                        </TabsContent>
                    </Tabs>
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
                                        <Badge variant={getStatusColor(selectedTicket.status)}>
                                            {getStatusText(selectedTicket.status)}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Category</Label>
                                    <div>{selectedTicket.category}</div>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Created</Label>
                                    <div>{formatDate(selectedTicket.created_at)}</div>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Last Updated</Label>
                                    <div>{formatDate(selectedTicket.updated_at)}</div>
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
                                                    {formatDate(reply.created_at)}
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
    );
}