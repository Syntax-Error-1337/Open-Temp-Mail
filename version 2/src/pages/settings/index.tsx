import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="container max-w-2xl py-8 space-y-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            {user.role === 'mailbox' ? <MailboxSettings user={user} /> : <UserSettings user={user} />}
        </div>
    );
}

function MailboxSettings({ user }: { user: any }) {
    const [isLoading, setIsLoading] = useState(true);
    const [forwardTo, setForwardTo] = useState('');
    const [mailboxId, setMailboxId] = useState<number | null>(null);

    useEffect(() => {
        const fetchInfo = async () => {
            if (!user.mailboxAddress) return;
            try {
                const res = await apiFetch(`/api/mailbox/info?address=${encodeURIComponent(user.mailboxAddress)}`);
                setForwardTo(res.forward_to || '');
                setMailboxId(res.id);
            } catch (error) {
                console.error('Failed to fetch mailbox info', error);
                toast.error('Failed to load settings');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInfo();
    }, [user.mailboxAddress]);

    const handleSaveForward = async () => {
        if (!mailboxId) return;
        try {
            await apiFetch('/api/mailbox/forward', {
                method: 'POST',
                body: JSON.stringify({ mailbox_id: mailboxId, forward_to: forwardTo })
            });
            toast.success('Forwarding settings saved');
        } catch (error) {
            toast.error('Failed to save forwarding settings');
        }
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <Tabs defaultValue="forwarding">
            <TabsList>
                <TabsTrigger value="forwarding">Forwarding</TabsTrigger>
                {/* <TabsTrigger value="password">Password</TabsTrigger> */}
            </TabsList>
            <TabsContent value="forwarding">
                <Card>
                    <CardHeader>
                        <CardTitle>Email Forwarding</CardTitle>
                        <CardDescription>Automatically forward received emails to another address.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Forward To</label>
                            <Input
                                placeholder="target@example.com"
                                value={forwardTo}
                                onChange={(e) => setForwardTo(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Leave empty to disable forwarding.</p>
                        </div>
                        <Button onClick={handleSaveForward}>Save Changes</Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

function UserSettings({ user }: { user: any }) {
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!password) {
            toast.error('Password cannot be empty');
            return;
        }
        setIsSaving(true);
        try {
            await apiFetch(`/api/users/${user.userId}`, {
                method: 'PATCH',
                body: JSON.stringify({ password })
            });
            toast.success('Password updated successfully');
            setPassword('');
        } catch (error) {
            toast.error('Failed to update password');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account credentials.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <Input
                        type="password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Update Password'}
                </Button>
            </CardContent>
        </Card>
    );
}
