import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trash2, RefreshCw, MailOpen, Mail, Search, KeyRound, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChangePasswordDialog } from './ChangePasswordDialog';

interface EmailSummary {
    id: number;
    sender: string;
    subject: string;
    preview: string;
    received_at: string;
    is_read?: boolean;
    mailbox_address?: string; // For admin all-mailbox view
}

interface EmailDetail extends EmailSummary {
    content?: string;
    html_content?: string;
    to_addrs: string;
    download?: string;
}

export default function Mailbox() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const queryMailbox = searchParams.get('mailbox');

    const targetMailbox = queryMailbox || user?.mailboxAddress;

    const [emails, setEmails] = useState<EmailSummary[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    // New features state
    const [searchQuery, setSearchQuery] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    const fetchEmails = useCallback(async (silent = false) => {
        // Allow admin to fetch all emails when no mailbox specified
        const isAdminAllView = !targetMailbox && user?.role === 'admin';

        if (!targetMailbox && !isAdminAllView) return;

        if (!silent) setIsLoadingList(true);
        try {
            let endpoint;
            if (isAdminAllView) {
                // Admin view: fetch all emails from all mailboxes
                endpoint = `/api/emails?limit=100&offset=0`;
            } else {
                // Specific mailbox view
                endpoint = `/api/emails?mailbox=${encodeURIComponent(targetMailbox!)}&limit=100&offset=0`;
            }

            const response = await apiFetch<{ results?: EmailSummary[] } | EmailSummary[]>(endpoint);

            if (Array.isArray(response)) {
                setEmails(response);
            } else if (response && Array.isArray(response.results)) {
                setEmails(response.results);
            }
        } catch (error) {
            console.error('Failed to fetch emails', error);
            if (!silent) toast.error('Failed to load emails');
        } finally {
            if (!silent) setIsLoadingList(false);
        }
    }, [targetMailbox, user?.role]);

    useEffect(() => {
        const isAdminAllView = !targetMailbox && user?.role === 'admin';
        if (targetMailbox || isAdminAllView) {
            fetchEmails();
        }
    }, [fetchEmails, targetMailbox, user?.role]);

    // Auto-refresh logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (autoRefresh) {
            interval = setInterval(() => fetchEmails(true), 15000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, fetchEmails]);

    // Filter emails
    const filteredEmails = useMemo(() => {
        if (!searchQuery.trim()) return emails;
        const query = searchQuery.toLowerCase();
        return emails.filter(email =>
            email.subject.toLowerCase().includes(query) ||
            email.sender.toLowerCase().includes(query) ||
            email.preview?.toLowerCase().includes(query)
        );
    }, [emails, searchQuery]);

    const handleSelectEmail = async (id: number) => {
        setIsLoadingDetail(true);
        setSelectedEmail(null);
        try {
            const data = await apiFetch<EmailDetail>(`/api/email/${id}`);
            if (data) {
                // Mark as read in local state
                setEmails(prev => prev.map(e => e.id === id ? { ...e, is_read: true } : e));
                setSelectedEmail(data);
            }
        } catch {
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
        } catch {
            toast.error('Failed to delete email');
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row p-4 gap-4">
            {/* Email List */}
            <Card className={cn("flex flex-col md:w-1/3 h-full", selectedEmail ? "hidden md:flex" : "flex")}>
                <CardHeader className="p-4 border-b space-y-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Inbox</CardTitle>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsChangePasswordOpen(true)}
                                title="Change Password"
                            >
                                <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => fetchEmails()}>
                                <RefreshCw className={cn("h-4 w-4", isLoadingList && "animate-spin")} />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search emails..."
                                className="pl-8 h-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{filteredEmails.length} messages</span>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="auto-refresh"
                                    checked={autoRefresh}
                                    onCheckedChange={(c) => setAutoRefresh(!!c)}
                                />
                                <Label htmlFor="auto-refresh">Auto-refresh</Label>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {filteredEmails.length === 0 && !isLoadingList && (
                        <div className="text-center py-10 text-muted-foreground">
                            <Mail className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            <p>{searchQuery ? 'No matching emails' : 'No emails yet'}</p>
                        </div>
                    )}
                    {filteredEmails.map((email) => (
                        <div
                            key={email.id}
                            onClick={() => handleSelectEmail(email.id)}
                            className={cn(
                                "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent relative group",
                                selectedEmail?.id === email.id ? "bg-accent border-primary/50" : "bg-card",
                                !email.is_read && "font-semibold bg-muted/30"
                            )}
                        >
                            {!email.is_read && (
                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />
                            )}
                            <div className="flex justify-between items-start mb-1">
                                <span className="truncate w-2/3">{email.sender}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDistanceToNow(new Date(email.received_at), { addSuffix: true })}
                                </span>
                            </div>
                            {email.mailbox_address && (
                                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                                    📬 {email.mailbox_address}
                                </div>
                            )}
                            <div className="text-sm truncate mb-1">{email.subject}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2 font-normal">
                                {email.preview}
                            </div>
                            <div className="mt-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={(e) => handleDelete(e, email.id)}
                                >
                                    <Trash2 className="h-3 w-3" />
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
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                                        From: <span className="text-foreground select-text">{selectedEmail.sender}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        To: <span className="text-foreground select-text">{selectedEmail.to_addrs}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(selectedEmail.received_at).toLocaleString()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedEmail.download && (
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={selectedEmail.download} download>Download EML</a>
                                        </Button>
                                    )}
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
                        <CardContent className="flex-1 p-0 overflow-hidden relative">
                            <div className="h-full w-full bg-white text-black p-4 overflow-auto select-text">
                                {selectedEmail.html_content ? (
                                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.html_content }} className="prose max-w-none" />
                                ) : (
                                    <pre className="whitespace-pre-wrap font-sans">{selectedEmail.content}</pre>
                                )}
                            </div>
                        </CardContent>
                    </>
                )}
            </Card>

            <ChangePasswordDialog
                open={isChangePasswordOpen}
                onOpenChange={setIsChangePasswordOpen}
            />
        </div>
    );
}
