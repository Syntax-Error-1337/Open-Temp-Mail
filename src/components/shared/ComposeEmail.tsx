import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useSender } from '@/hooks/useSender';
import { Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import toast from 'react-hot-toast';

export function ComposeEmail({ onClose, initialValues }: { 
    onClose?: () => void;
    initialValues?: { to?: string; subject?: string; body?: string; isHtml?: boolean } 
}) {
    const { user } = useAuth();
    const { sendEmail, isSending } = useSender();
    const [to, setTo] = useState(initialValues?.to || '');
    const [subject, setSubject] = useState(initialValues?.subject || '');
    const [body, setBody] = useState(initialValues?.body || '');
    const [isHtml, setIsHtml] = useState(initialValues?.isHtml || false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!to || !subject || !body) {
            toast.error('Please fill in all fields');
            return;
        }

        const payload = {
            from: user?.mailboxAddress || user?.username || '', // Fallback or handle correctly
            to,
            subject,
            [isHtml ? 'html' : 'text']: body,
        };

        const success = await sendEmail(payload);
        if (success) {
            setTo('');
            setSubject('');
            setBody('');
            if (onClose) onClose();
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Compose Email</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="to" className="text-sm font-medium">To</label>
                        <Input
                            id="to"
                            placeholder="recipient@example.com"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            disabled={isSending}
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                        <Input
                            id="subject"
                            placeholder="Enter subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            disabled={isSending}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label htmlFor="body" className="text-sm font-medium">Message</label>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-muted-foreground">Plain Text</span>
                                <button
                                    type="button"
                                    onClick={() => setIsHtml(!isHtml)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isHtml ? 'bg-primary' : 'bg-input'}`}
                                >
                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-background transition-transform ${isHtml ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                                <span className="text-xs text-muted-foreground">HTML</span>
                            </div>
                        </div>
                        <textarea
                            id="body"
                            className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Type your message here..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            disabled={isSending}
                        />
                    </div>
                    <CardFooter className="px-0 pt-4 flex justify-end">
                        <Button type="submit" disabled={isSending}>
                            {isSending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Email
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </CardContent>
        </Card>
    );
}
