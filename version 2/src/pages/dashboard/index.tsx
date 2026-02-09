import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Mail, Users, Trash2, ExternalLink, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserList } from './UserList';

interface Mailbox {
    id: number;
    address: string;
    created_at: string;
    email_count?: number;
    is_favorite?: boolean;
    forward_to?: string;
}

export default function Dashboard() {
    const { user } = useAuth();
    const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'favorites' | 'forwarding'>('all');

    const isMailboxUser = user?.role === 'mailbox';
    const isAdmin = user?.role === 'admin';

    const fetchMailboxes = async () => {
        if (isMailboxUser) return;
        setIsLoading(true);
        try {
            let url = '/api/mailboxes?limit=20';
            if (filter === 'favorites') url += '&favorite=true';
            if (filter === 'forwarding') url += '&forward=true';

            const data = await apiFetch<any>(url);
            if (data.success && Array.isArray(data.results || data.list)) {
                setMailboxes(data.results || data.list);
            }
        } catch (error) {
            console.error('Failed to fetch mailboxes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMailboxes();
    }, [user, filter]);

    const toggleFavorite = async (mailbox: Mailbox) => {
        try {
            await apiFetch('/api/mailbox/favorite', {
                method: 'POST',
                body: JSON.stringify({ mailbox_id: mailbox.id })
            });
            setMailboxes(mailboxes.map(m =>
                m.id === mailbox.id ? { ...m, is_favorite: !m.is_favorite } : m
            ));
            toast.success(mailbox.is_favorite ? 'Removed from favorites' : 'Added to favorites');
        } catch (error) {
            toast.error('Failed to update favorite status');
        }
    };

    const handleDeleteMailbox = async (id: number) => {
        if (!confirm('Delete this mailbox?')) return;
        try {
            await apiFetch(`/api/mailboxes?id=${id}`, { method: 'DELETE' });
            toast.success('Mailbox deleted');
            setMailboxes(mailboxes.filter(m => m.id !== id));
        } catch (error) {
            toast.error('Failed to delete mailbox');
        }
    };

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
                                <div className="text-2xl font-bold">{mailboxes.length}</div>
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
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Mailboxes</CardTitle>
                                <CardDescription>
                                    Manage your temporary mailboxes here.
                                </CardDescription>
                            </div>
                            <div className="flex bg-muted p-1 rounded-md">
                                <Button
                                    variant={filter === 'all' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setFilter('all')}
                                >
                                    All
                                </Button>
                                <Button
                                    variant={filter === 'favorites' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setFilter('favorites')}
                                    className="gap-2"
                                >
                                    <Star className="h-3 w-3" /> Favorites
                                </Button>
                                <Button
                                    variant={filter === 'forwarding' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setFilter('forwarding')}
                                >
                                    Forwarding
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    {mailboxes.map(mb => (
                                        <div key={mb.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                                    <Mail className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{mb.address}</p>
                                                        {mb.forward_to && (
                                                            <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                                                                Forwarding
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Created {formatDistanceToNow(new Date(mb.created_at), { addSuffix: true })}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => toggleFavorite(mb)}
                                                    className={mb.is_favorite ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100/50" : "text-muted-foreground hover:text-yellow-500"}
                                                >
                                                    <Star className={`h-4 w-4 ${mb.is_favorite ? "fill-current" : ""}`} />
                                                </Button>
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link to={`/mailbox?mailbox=${mb.address}`}><ExternalLink className="h-4 w-4" /></Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteMailbox(mb.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {mailboxes.length === 0 && !isLoading && (
                                        <p className="text-center text-muted-foreground py-8">No mailboxes found.</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="users">
                        <UserList />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
