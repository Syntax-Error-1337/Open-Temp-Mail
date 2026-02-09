
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, UserPlus, Edit, Mail, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserMailboxesDialog } from './UserMailboxesDialog';

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
    const [managingMailboxesUser, setManagingMailboxesUser] = useState<UserData | null>(null);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch<UserData[]>('/api/users?limit=50');
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch {
            console.error('Failed to fetch users');
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
        } catch {
            toast.error('Failed to delete user');
        }
    };

    return (
        <Card className="col-span-3">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Users</CardTitle>
                        <CardDescription>Manage system users.</CardDescription>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create User
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Mailboxes</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.username}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{user.mailbox_count || 0} / {user.mailbox_limit}</TableCell>
                                    <TableCell>{formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => setEditingUser(user)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setManagingMailboxesUser(user)} title="Manage Mailboxes">
                                                <Mail className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <CreateUserDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={fetchUsers} />

            {editingUser && (
                <EditUserDialog
                    user={editingUser}
                    open={!!editingUser}
                    onOpenChange={(open) => !open && setEditingUser(null)}
                    onSuccess={() => { setEditingUser(null); fetchUsers(); }}
                />
            )}

            {managingMailboxesUser && (
                <UserMailboxesDialog
                    user={managingMailboxesUser}
                    open={!!managingMailboxesUser}
                    onOpenChange={(open) => !open && setManagingMailboxesUser(null)}
                />
            )}
        </Card>
    );
}

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    user?: UserData;
}

function CreateUserDialog({ open, onOpenChange, onSuccess }: UserDialogProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [mailboxLimit, setMailboxLimit] = useState('5');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await apiFetch<{ success?: boolean }>('/api/users', {
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
                onOpenChange(false);
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to create user';
            toast.error(msg);
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
                        <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="password" required />
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

function EditUserDialog({ user, open, onOpenChange, onSuccess }: UserDialogProps) {
    const [role, setRole] = useState(user?.role || 'user');
    const [mailboxLimit, setMailboxLimit] = useState(user?.mailbox_limit?.toString() || '5');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setRole(user.role);
            setMailboxLimit(user.mailbox_limit.toString());
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);
        try {
            const body: Partial<UserData> & { password?: string; mailboxLimit: number } = {
                role,
                mailboxLimit: parseInt(mailboxLimit)
            };
            if (password) body.password = password;

            await apiFetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                body: JSON.stringify(body)
            });

            toast.success('User updated successfully');
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to update user';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User: {user?.username}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <div className="space-y-2">
                        <label className="text-sm font-medium">New Password (optional)</label>
                        <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Leave empty to keep current" />
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
