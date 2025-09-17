
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare, PenSquare, Search, Tags } from "lucide-react";


export default function ForumCategoryPage() {

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-primary" />
                        General Discussion
                    </h1>
                    <p className="text-muted-foreground mt-1">Talk about anything and everything related to CS2 and the community.</p>
                </div>
                 <Button>
                    <PenSquare className="mr-2"/>
                    Create New Topic
                </Button>
            </div>
            
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search topics..." className="pl-10" />
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Tags className="mr-2 h-4 w-4"/>
                        Filter by Tags
                    </Button>
                     <Button variant="outline" size="sm">
                        Show: All
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60%]">Topic</TableHead>
                                <TableHead className="text-center">Author</TableHead>
                                <TableHead className="text-center">Replies / Views</TableHead>
                                <TableHead>Last Post</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={4}>
                                    <p className="text-sm text-muted-foreground">No topics yet.</p>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="flex justify-center">
                 <Button variant="outline">Load More Topics</Button>
            </div>
        </div>
    )
}
