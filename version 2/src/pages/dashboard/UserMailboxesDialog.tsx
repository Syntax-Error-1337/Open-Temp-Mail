import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Plus, Mail } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import toast from 'react-hot-toast';
import { AssignMailboxDialog } from './AssignMailboxDialog';

interface UserMailboxesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: { id: number; username: string } | null;
}

interface UserMailbox {
    id: number;
    address: string;
    created_at: string;
    is_pinned: number;
}

export function UserMailboxesDialog({ open, onOpenChange, user }: UserMailboxesDialogProps) {
    const [mailboxes, setMailboxes] = useState<UserMailbox[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);

    const fetchMailboxes = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await apiFetch<UserMailbox[]>(`/api/users/${user.id}/mailboxes`);
            if (Array.isArray(data)) {
                setMailboxes(data);
            }
        } catch (error) {
            console.error('Failed to fetch user mailboxes');
            toast.error('Failed to load mailboxes');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (open && user) {
            fetchMailboxes();
        }
    }, [open, user, fetchMailboxes]);

    const handleUnassign = async (address: string) => {
        if (!user) return;
        if (!confirm(`Are you sure you want to unassign ${address} from ${user.username}?`)) return;

        try {
            await apiFetch('/api/users/unassign', {
                method: 'POST',
                body: JSON.stringify({
                    username: user.username,
                    address: address
                })
            });
            toast.success('Mailbox unassigned');
            setMailboxes(prev => prev.filter(m => m.address !== address));
        } catch (error: any) {
            toast.error(error.message || 'Failed to unassign mailbox');
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Manage Mailboxes: {user?.username}</DialogTitle>
                        <DialogDescription>
                            View and manage mailboxes assigned to this user.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end mb-2">
                        <Button size="sm" onClick={() => setIsAssignOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Assign New Mailbox
                        </Button>
                    </div>

                    <div className="border rounded-md">
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                        ) : mailboxes.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                No mailboxes assigned to this user.
                            </div>
                        ) : (
                            <div className="divide-y">
                                {mailboxes.map(mb => (
                                    <div key={mb.id} className="flex items-center justify-between p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                                <Mail className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{mb.address}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Assigned {new Date(mb.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => handleUnassign(mb.address)}
                                            title="Unassign Mailbox"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AssignMailboxDialog
                open={isAssignOpen}
                onOpenChange={setIsAssignOpen}
                user={user}
                onSuccess={() => {
                    fetchMailboxes();
                    // Optionally refresh parent list stats? 
                }}
            />
        </>
    );
}
