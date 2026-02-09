import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Star, ExternalLink, Trash2, ArrowRight, Lock, Unlock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

export interface Mailbox {
    id: number;
    address: string;
    created_at: string;
    is_pinned?: number;
    is_favorite?: boolean;
    forward_to?: string;
    can_login?: boolean;
    password_is_default?: boolean;
}

interface MailboxCardProps {
    mailbox: Mailbox;
    selected: boolean;
    onSelect: (checked: boolean) => void;
    onToggleFavorite: (mailbox: Mailbox) => void;
    onDelete: (id: number) => void;
    onSetForward: (mailbox: Mailbox) => void;
    onToggleLogin: (mailbox: Mailbox) => void;
}

export function MailboxCard({ mailbox, selected, onSelect, onToggleFavorite, onDelete, onSetForward, onToggleLogin }: MailboxCardProps) {
    return (
        <Card className={cn(
            "relative group transition-all hover:shadow-md",
            selected && "border-primary ring-1 ring-primary"
        )}>
            <div className="absolute top-3 left-3 z-10">
                <Checkbox checked={selected} onCheckedChange={(c) => onSelect(!!c)} />
            </div>
            <CardContent className="p-4 pt-10">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                            mailbox.is_pinned ? "bg-yellow-100 text-yellow-600" : "bg-primary/10 text-primary"
                        )}>
                            <Mail className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold truncate text-sm" title={mailbox.address}>
                                {mailbox.address}
                            </h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                {formatDistanceToNow(new Date(mailbox.created_at), { addSuffix: true })}
                                {!mailbox.can_login && <span className="text-destructive font-medium">(Login Disabled)</span>}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4 h-6">
                    {mailbox.forward_to && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded-full flex items-center gap-1 max-w-full truncate">
                            <ArrowRight className="h-3 w-3" /> {mailbox.forward_to}
                        </span>
                    )}
                    {mailbox.is_favorite && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" /> Favorite
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between gap-1 pt-2 border-t">
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => onToggleFavorite(mailbox)}
                            title={mailbox.is_favorite ? "Remove from favorites" : "Add to favorites"}
                        >
                            <Star className={cn("h-4 w-4", mailbox.is_favorite && "fill-yellow-400 text-yellow-400")} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                            onClick={() => onSetForward(mailbox)}
                            title="Set Forwarding"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8", mailbox.can_login ? "text-green-500" : "text-red-500")}
                            onClick={() => onToggleLogin(mailbox)}
                            title={mailbox.can_login ? "Disable Login" : "Enable Login"}
                        >
                            {mailbox.can_login ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </Button>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Go to Inbox">
                            <Link to={`/mailbox?mailbox=${mailbox.address}`}><ExternalLink className="h-4 w-4" /></Link>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => onDelete(mailbox.id)}
                            title="Delete Mailbox"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function MailboxListItem({ mailbox, selected, onSelect, onToggleFavorite, onDelete, onSetForward, onToggleLogin }: MailboxCardProps) {
    return (
        <div className={cn(
            "flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors group",
            selected && "border-primary bg-primary/5"
        )}>
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <Checkbox checked={selected} onCheckedChange={(c) => onSelect(!!c)} />
                <div className={cn(
                    "h-9 w-9 rounded-md flex items-center justify-center shrink-0",
                    mailbox.is_pinned ? "bg-yellow-100 text-yellow-600" : "bg-primary/10 text-primary"
                )}>
                    <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{mailbox.address}</span>
                        {mailbox.forward_to && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <ArrowRight className="h-3 w-3" /> {mailbox.forward_to}
                            </span>
                        )}
                        {!mailbox.can_login && <span className="text-xs text-destructive font-medium border border-destructive/20 px-1 rounded">Login Disabled</span>}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>Created {formatDistanceToNow(new Date(mailbox.created_at), { addSuffix: true })}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1 ml-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => onToggleFavorite(mailbox)}
                >
                    <Star className={cn("h-4 w-4", mailbox.is_favorite && "fill-yellow-400 text-yellow-400")} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                    onClick={() => onSetForward(mailbox)}
                >
                    <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", mailbox.can_login ? "text-green-500" : "text-red-500")}
                    onClick={() => onToggleLogin(mailbox)}
                >
                    {mailbox.can_login ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link to={`/mailbox?mailbox=${mailbox.address}`}><ExternalLink className="h-4 w-4" /></Link>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(mailbox.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
