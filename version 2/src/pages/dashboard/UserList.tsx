import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, UserPlus, Edit, Shield, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface UserData {
    id: number;
    username: string;
    role: string;
    can_send: number;
    mailbox_limit: number;
    created_at: string;
    mailbox_count?: number;
}

export function UserList() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch<UserData[]>('/api/users?limit=50');
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteUser = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
            toast.success('User deleted');
            setUsers(users.filter(u => u.id !== id));
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const [editingUser, setEditingUser] = useState<UserData | null>(null);

    return (
        <Card className="col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage system users and administrators.</CardDescription>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="space-y-2">
                            {users.map(u => (
                                <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded flex items-center justify-center ${u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            {u.role === 'admin' ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{u.username}</p>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                                    {u.role}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Created {u.created_at ? formatDistanceToNow(new Date(u.created_at), { addSuffix: true }) : 'Unknown'} • {u.mailbox_count || 0} mailboxes
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => setEditingUser(u)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteUser(u.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {users.length === 0 && <p className="text-center text-muted-foreground">No users found.</p>}
                        </div>
                    )}
                </div>
            </CardContent>

            <CreateUserDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={() => { setIsCreateOpen(false); fetchUsers(); }}
            />
            {editingUser && (
                <EditUserDialog
                    user={editingUser}
                    open={!!editingUser}
                    onOpenChange={(open) => !open && setEditingUser(null)}
                    onSuccess={() => { setEditingUser(null); fetchUsers(); }}
                />
            )}
        </Card>
    );
}

function EditUserDialog({ user, open, onOpenChange, onSuccess }: { user: UserData, open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(user.role);
    const [mailboxLimit, setMailboxLimit] = useState(user.mailbox_limit.toString());
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when user changes
    useEffect(() => {
        setRole(user.role);
        setMailboxLimit(user.mailbox_limit.toString());
        setPassword('');
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const body: any = {
                role,
                mailboxLimit: parseInt(mailboxLimit)
            };
            if (password) body.password = password;

            const res = await apiFetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                body: JSON.stringify(body)
            });
            if (res) {
                toast.success('User updated successfully');
                onSuccess();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update user');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User: {user.username}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">New Password</label>
                        <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Leave empty to keep current" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mailbox Limit</label>
                        <Input value={mailboxLimit} onChange={e => setMailboxLimit(e.target.value)} type="number" min="1" required />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function CreateUserDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [mailboxLimit, setMailboxLimit] = useState('10');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await apiFetch('/api/users', {
                method: 'POST',
                body: JSON.stringify({
                    username,
                    password,
                    role,
                    mailboxLimit: parseInt(mailboxLimit)
                })
            });
            if (res) {
                toast.success('User created successfully');
                setUsername('');
                setPassword('');
                onSuccess();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to create user');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Username</label>
                        <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="password" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mailbox Limit</label>
                        <Input value={mailboxLimit} onChange={e => setMailboxLimit(e.target.value)} type="number" min="1" required />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create User
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
