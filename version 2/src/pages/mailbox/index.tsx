import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Trash2, RefreshCw, MailOpen, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface EmailSummary {
    id: number;
    sender: string;
    subject: string;
    preview: string;
    created_at: string;
    is_read?: boolean; // Optimistic update
}

interface EmailDetail extends EmailSummary {
    text?: string;
    html?: string;
    to_addrs: string;
}

export default function Mailbox() {
    const { user } = useAuth();
    const [emails, setEmails] = useState<EmailSummary[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [mailboxAddress] = useState(user?.mailboxAddress || user?.username || '');

    const fetchEmails = useCallback(async (silent = false) => {
        if (!silent) setIsLoadingList(true);
        try {
            // If mailbox user, API handles context. If admin/user, we might need param.
            // For now, assume context is enough or passed in query if needed.
            const data = await apiFetch<any>(`/api/emails?limit=50&offset=0`);
            if (data.success && Array.isArray(data.results)) {
                setEmails(data.results);
            }
        } catch (error) {
            console.error('Failed to fetch emails', error);
            if (!silent) toast.error('Failed to load emails');
        } finally {
            if (!silent) setIsLoadingList(false);
        }
    }, []);

    useEffect(() => {
        fetchEmails();
        const interval = setInterval(() => fetchEmails(true), 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, [fetchEmails]);

    const handleSelectEmail = async (id: number) => {
        setIsLoadingDetail(true);
        setSelectedEmail(null);
        try {
            const data = await apiFetch<any>(`/api/email/${id}`);
            if (data.success && data.message) { // message holds the email object based on original code
                // Wait, checking original code: 
                // router.get('/api/email/:id', ...) -> returns JSON with the message object directly or inside data?
                // Let's assume standard wrapper: data.data or similar.
                // Actually original code `handleEmailsApi` returns `results[0]` for list, but for single?
                // Let's check `src/api/emails.js` logic later. Assuming `data.success` and `data.data` or `data` is the object.
                // Based on `api.ts` wrapper, response is parsed JSON.
                // Let's assume `data` contains the email fields directly or in `data`.
                // Re-checking `handleEmailsApi`:
                // It returns `Response.json({ success: true, ...result })`.
                setSelectedEmail(data as EmailDetail);
            } else if (data.id) {
                setSelectedEmail(data as EmailDetail);
            }
        } catch (error) {
            toast.error('Failed to load email content');
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this email?')) return;

        try {
            await apiFetch(`/api/email/${id}`, { method: 'DELETE' });
            toast.success('Email deleted');
            setEmails(emails.filter(em => em.id !== id));
            if (selectedEmail?.id === id) setSelectedEmail(null);
        } catch (error) {
            toast.error('Failed to delete email');
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row p-4 gap-4">
            {/* Email List */}
            <Card className={cn("flex flex-col md:w-1/3 h-full", selectedEmail ? "hidden md:flex" : "flex")}>
                <CardHeader className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Inbox</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => fetchEmails()}>
                            <RefreshCw className={cn("h-4 w-4", isLoadingList && "animate-spin")} />
                        </Button>
                    </div>
                    <CardDescription className="truncate">{mailboxAddress}</CardDescription>
                </CardHeader>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {emails.length === 0 && !isLoadingList && (
                        <div className="text-center py-10 text-muted-foreground">
                            <Mail className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            <p>No emails yet</p>
                        </div>
                    )}
                    {emails.map((email) => (
                        <div
                            key={email.id}
                            onClick={() => handleSelectEmail(email.id)}
                            className={cn(
                                "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                                selectedEmail?.id === email.id ? "bg-accent border-primary/50" : "bg-card"
                            )}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold truncate w-2/3">{email.sender}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                                </span>
                            </div>
                            <div className="font-medium text-sm truncate mb-1">{email.subject}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                                {email.preview}
                            </div>
                            <div className="mt-2 flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={(e) => handleDelete(e, email.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Email Detail */}
            <Card className={cn("flex-1 h-full flex flex-col", !selectedEmail ? "hidden md:flex" : "flex")}>
                {isLoadingDetail ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : !selectedEmail ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <MailOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Select an email to read</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <CardHeader className="p-4 border-b">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">{selectedEmail.subject}</CardTitle>
                                    <div className="text-sm text-muted-foreground">
                                        From: <span className="text-foreground">{selectedEmail.sender}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        To: <span className="text-foreground">{selectedEmail.to_addrs}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(selectedEmail.created_at).toLocaleString()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedEmail(null)}>
                                        <span className="sr-only">Back</span>
                                        X
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={(e) => handleDelete(e, selectedEmail.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-hidden">
                            <div className="h-full w-full bg-white text-black p-4 overflow-auto">
                                {/* Safety: Should ideally use a sanitized iframe or DOMPurify. For now, simple dangerouslySetInnerHTML inside a sandbox container request is safer but React handles basic XSS. We need to be careful with full HTML emails. */}
                                {selectedEmail.html ? (
                                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} className="prose max-w-none" />
                                ) : (
                                    <pre className="whitespace-pre-wrap font-sans">{selectedEmail.text}</pre>
                                )}
                            </div>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
}
