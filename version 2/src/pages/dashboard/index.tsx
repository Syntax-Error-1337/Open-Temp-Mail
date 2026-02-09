import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Mail, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserList } from './UserList';
import { MailboxList } from './MailboxList';

export default function Dashboard() {
    const { user } = useAuth();
    // Overview state
    const [stats, setStats] = useState({ total: 0, online: true });

    // Mailbox User state
    const isMailboxUser = user?.role === 'mailbox';
    const isAdmin = user?.role === 'admin';

    // Fetch basic stats for overview
    const fetchStats = useCallback(async () => {
        if (!user || user.role !== 'admin') return;
        try {
            // Re-using mailboxes endpoint or dedicated stats endpoint if available
            // For now, let's just use the mailboxes endpoint to get total count
            const data = await apiFetch<{ total: number }>('/api/mailboxes?limit=1');
            if (data && typeof data.total === 'number') {
                setStats(s => ({ ...s, total: data.total }));
            }
        } catch {
            console.error('Failed to fetch stats');
        }
    }, [user]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void fetchStats();
    }, [fetchStats]);

    if (isMailboxUser) {
        return (
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold">Welcome, {user?.username}</h1>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">My Inbox</CardTitle>
                            <Mail className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Check Mail</div>
                            <p className="text-xs text-muted-foreground">
                                View your received messages
                            </p>
                            <Button asChild className="mt-4 w-full">
                                <Link to="/mailbox">Go to Inbox</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Dashboard</h1>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    {isAdmin && <TabsTrigger value="mailboxes">Mailboxes</TabsTrigger>}
                    {isAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Mailboxes</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <p className="text-xs text-muted-foreground">
                                    Active mailboxes managed
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                                <div className="h-4 w-4 rounded-full bg-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Online</div>
                                <p className="text-xs text-muted-foreground">
                                    Cloudflare Worker active
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>
                                Overview of system activity.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">
                                System running normally. Use the tabs above to manage Mailboxes and Users.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="mailboxes" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Mailbox Management</CardTitle>
                                <CardDescription>
                                    Manage all temporary mailboxes, filter by domain, and perform batch actions.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <MailboxList />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {isAdmin && (
                    <TabsContent value="users">
                        <UserList />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
