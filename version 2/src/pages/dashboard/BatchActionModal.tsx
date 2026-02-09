import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '@/lib/api';

interface BatchActionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    action: 'allow' | 'deny' | 'favorite' | 'unfavorite' | 'forward' | 'clear-forward' | null;
    selectedMailboxes: string[];
    onSuccess: () => void;
}

export function BatchActionModal({ open, onOpenChange, action, selectedMailboxes, onSuccess }: BatchActionModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [forwardTo, setForwardTo] = useState('');

    const getActionDetails = () => {
        switch (action) {
            case 'allow': return { title: 'Batch Allow Login', icon: '✅', confirmText: 'Allow Login' };
            case 'deny': return { title: 'Batch Deny Login', icon: '🚫', confirmText: 'Deny Login' };
            case 'favorite': return { title: 'Batch Favorite', icon: '⭐', confirmText: 'Add to Favorites' };
            case 'unfavorite': return { title: 'Batch Unfavorite', icon: '☆', confirmText: 'Remove from Favorites' };
            case 'forward': return { title: 'Batch Set Forwarding', icon: '↪️', confirmText: 'Set Forwarding' };
            case 'clear-forward': return { title: 'Batch Clear Forwarding', icon: '🚫', confirmText: 'Clear Forwarding' };
            default: return { title: 'Batch Action', icon: '⚡', confirmText: 'Confirm' };
        }
    };

    const { title, icon, confirmText } = getActionDetails();

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            if (action === 'allow' || action === 'deny') {
                await apiFetch('/api/mailboxes/batch-toggle-login', {
                    method: 'POST',
                    body: JSON.stringify({
                        addresses: selectedMailboxes,
                        can_login: action === 'allow'
                    })
                });
            } else if (action === 'favorite' || action === 'unfavorite') {
                await apiFetch('/api/mailboxes/batch-favorite-by-address', {
                    method: 'POST',
                    body: JSON.stringify({
                        addresses: selectedMailboxes,
                        is_favorite: action === 'favorite'
                    })
                });
            } else if (action === 'forward') {
                if (!forwardTo || !forwardTo.includes('@')) {
                    toast.error('Please enter a valid email address');
                    setIsLoading(false);
                    return;
                }
                await apiFetch('/api/mailboxes/batch-forward-by-address', {
                    method: 'POST',
                    body: JSON.stringify({
                        addresses: selectedMailboxes,
                        forward_to: forwardTo
                    })
                });
            } else if (action === 'clear-forward') {
                await apiFetch('/api/mailboxes/batch-forward-by-address', {
                    method: 'POST',
                    body: JSON.stringify({
                        addresses: selectedMailboxes,
                        forward_to: null
                    })
                });
            }

            toast.success('Batch action completed successfully');
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Batch action failed:', error);
            toast.error(error.message || 'Batch action failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span>{title}</span>
                    </DialogTitle>
                    <DialogDescription>
                        You are about to apply this action to <strong>{selectedMailboxes.length}</strong> mailboxes.
                    </DialogDescription>
                </DialogHeader>

                {action === 'forward' && (
                    <div className="py-2">
                        <label className="text-sm font-medium mb-1 block">Forward To</label>
                        <Input
                            value={forwardTo}
                            onChange={(e) => setForwardTo(e.target.value)}
                            placeholder="target@example.com"
                            type="email"
                        />
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
