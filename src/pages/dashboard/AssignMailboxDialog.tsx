import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import toast from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AssignMailboxDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: { id: number; username: string } | null;
    onSuccess: () => void;
}

export function AssignMailboxDialog({ open, onOpenChange, user, onSuccess }: AssignMailboxDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [localPart, setLocalPart] = useState('');
    const [domain, setDomain] = useState('');
    const [domains, setDomains] = useState<string[]>([]);
    const [customAddress, setCustomAddress] = useState('');
    const [mode, setMode] = useState<'create' | 'existing'>('create');

    const fetchDomains = useCallback(async () => {
        try {
            const data = await apiFetch<string[]>('/api/domains');
            if (Array.isArray(data) && data.length > 0) {
                setDomains(data);
                setDomain(data[0]);
            }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (open) {
            fetchDomains();
            setLocalPart('');
            setCustomAddress('');
        }
    }, [open, fetchDomains]);

    const handleAssign = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const address = mode === 'create'
                ? `${localPart}@${domain}`
                : customAddress;

            if (!address || !address.includes('@')) {
                toast.error('Invalid email address');
                setIsLoading(false);
                return;
            }

            // Call API to assign
            // worker/api/users.js: /api/users/assign POST { username, address }
            await apiFetch('/api/users/assign', {
                method: 'POST',
                body: JSON.stringify({
                    username: user.username,
                    address: address
                })
            });

            toast.success(`Mailbox assigned to ${user.username}`);
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to assign mailbox';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Mailbox</DialogTitle>
                    <DialogDescription>
                        Assign a new or existing mailbox to <strong>{user?.username}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant={mode === 'create' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setMode('create')}
                            className="flex-1"
                        >
                            Create New
                        </Button>
                        <Button
                            variant={mode === 'existing' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setMode('existing')}
                            className="flex-1"
                        >
                            Assign Existing
                        </Button>
                    </div>

                    {mode === 'create' ? (
                        <div className="grid gap-2">
                            <Label htmlFor="local-part">Email Address</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="local-part"
                                    value={localPart}
                                    onChange={(e) => setLocalPart(e.target.value)}
                                    placeholder="username"
                                    className="flex-1"
                                />
                                <Select value={domain} onValueChange={setDomain}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Domain" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {domains.map(d => (
                                            <SelectItem key={d} value={d}>@{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <Label htmlFor="custom-address">Full Email Address</Label>
                            <Input
                                id="custom-address"
                                value={customAddress}
                                onChange={(e) => setCustomAddress(e.target.value)}
                                placeholder="existing@example.com"
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter the full address of a mailbox that already exists or one you want to create and assign.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleAssign} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assign
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
