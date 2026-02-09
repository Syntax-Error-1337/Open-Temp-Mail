import { useEffect } from 'react';
import { useSender } from '@/hooks/useSender';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Send, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SentMailbox() {
    const { user } = useAuth();
    const { fetchSentEmails, sentEmails, isLoadingSent } = useSender();

    useEffect(() => {
        if (user) {
            const fromAddr = user.mailboxAddress || user.username;
            if (fromAddr) {
                fetchSentEmails(fromAddr);
            }
        }
    }, [user, fetchSentEmails]);

    return (
        <div className="h-[calc(100vh-4rem)] p-4 md:p-6 flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Send className="h-6 w-6" />
                    Sent Emails
                </h1>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col">
                <CardHeader className="py-3 px-4 border-b bg-muted/40">
                    <CardTitle className="text-sm font-medium">History</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                    <ScrollArea className="h-full">
                        {isLoadingSent ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : sentEmails.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                No sent emails found.
                            </div>
                        ) : (
                            <div className="divide-y">
                                {sentEmails.map((email) => (
                                    <div key={email.id} className="p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium truncate max-w-[200px] md:max-w-md">
                                                To: {email.recipients}
                                            </span>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <div className="text-sm text-foreground mb-1">
                                            {email.subject || '(No Subject)'}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${email.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                email.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                {email.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
