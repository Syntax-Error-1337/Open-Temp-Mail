import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Mailbox {
    id: number;
    address: string;
    forward_to?: string;
}

interface ForwardMailboxDialogProps {
    mailbox: Mailbox;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (mailboxId: number, forwardTo: string | null) => void;
}

export function ForwardMailboxDialog({ mailbox, open, onOpenChange, onSuccess }: ForwardMailboxDialogProps) {
    const [forwardTo, setForwardTo] = useState(mailbox.forward_to || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setForwardTo(mailbox.forward_to || '');
    }, [mailbox]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const target = forwardTo.trim() || null;
            await apiFetch('/api/mailbox/forward', {
                method: 'POST',
                body: JSON.stringify({
                    mailbox_id: mailbox.id,
                    forward_to: target
                })
            });

            toast.success(target ? 'Forwarding set successfully' : 'Forwarding disabled');
            onSuccess(mailbox.id, target);
            onOpenChange(false);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to update forwarding settings';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Forward Mailbox: {mailbox.address}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Forward To Email</label>
                        <Input
                            value={forwardTo}
                            onChange={e => setForwardTo(e.target.value)}
                            placeholder="user@example.com (Leave empty to disable)"
                            type="email"
                        />
                        <p className="text-xs text-muted-foreground">
                            Emails sent to <strong>{mailbox.address}</strong> will be forwarded to this address.
                            <br />
                            Note: The destination email must be verified in your Cloudflare Email Routing settings.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Settings
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
