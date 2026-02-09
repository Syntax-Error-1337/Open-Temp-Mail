import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, LayoutGrid, List as ListIcon, MoreHorizontal, RefreshCw } from 'lucide-react';
import { type Mailbox, MailboxCard, MailboxListItem } from './MailboxCard';
import { BatchActionModal } from './BatchActionModal';
import { ForwardMailboxDialog } from './ForwardMailboxDialog';
import toast from 'react-hot-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from '@/components/ui/checkbox';

export function MailboxList() {
    const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Filters & Pagination
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterDomain, setFilterDomain] = useState('all');
    const [filterLogin, setFilterLogin] = useState('all');
    const [filterFavorite, setFilterFavorite] = useState('all');
    const [filterForward, setFilterForward] = useState('all');

    // Selection
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Modals
    const [batchAction, setBatchAction] = useState<'allow' | 'deny' | 'favorite' | 'unfavorite' | 'forward' | 'clear-forward' | null>(null);
    const [forwardMailbox, setForwardMailbox] = useState<Mailbox | null>(null);
    const [domains, setDomains] = useState<string[]>([]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchDomains = useCallback(async () => {
        try {
            const data = await apiFetch<string[]>('/api/domains');
            if (Array.isArray(data)) setDomains(data);
        } catch { /* ignore */ }
    }, []);

    const fetchMailboxes = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('size', pageSize.toString());
            if (debouncedSearch) params.set('q', debouncedSearch);
            if (filterDomain && filterDomain !== 'all') params.set('domain', filterDomain);
            if (filterLogin && filterLogin !== 'all') params.set('login', filterLogin);
            if (filterFavorite && filterFavorite !== 'all') params.set('favorite', filterFavorite);
            if (filterForward && filterForward !== 'all') params.set('forward', filterForward);

            const data = await apiFetch<{ list: Mailbox[], total: number }>(`/api/mailboxes?${params.toString()}`);
            if (data && Array.isArray(data.list)) {
                setMailboxes(data.list);
                setTotal(data.total);
            } else {
                setMailboxes([]);
                setTotal(0);
            }
        } catch (error) {
            console.error('Failed to fetch mailboxes', error);
            toast.error('Failed to load mailboxes');
        } finally {
            setIsLoading(false);
        }
    }, [page, pageSize, debouncedSearch, filterDomain, filterLogin, filterFavorite, filterForward]);

    useEffect(() => {
        fetchDomains();
    }, [fetchDomains]);

    useEffect(() => {
        fetchMailboxes();
    }, [fetchMailboxes]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filterDomain, filterLogin, filterFavorite, filterForward]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(mailboxes.map(m => m.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(i => i !== id));
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this mailbox?')) return;
        try {
            const m = mailboxes.find(x => x.id === id);
            if (!m) return;
            // API expects address for delete usually, checking original code...
            // worker/api/mailboxAdmin.js uses `address` query param for delete.
            await apiFetch(`/api/mailboxes?address=${encodeURIComponent(m.address)}`, { method: 'DELETE' });
            toast.success('Mailbox deleted');
            fetchMailboxes();
            setSelectedIds(prev => prev.filter(i => i !== id));
        } catch {
            toast.error('Failed to delete mailbox');
        }
    };

    const handleToggleFavorite = async (mailbox: Mailbox) => {
        try {
            await apiFetch('/api/mailbox/favorite', {
                method: 'POST',
                body: JSON.stringify({ mailbox_id: mailbox.id })
            });
            setMailboxes(current => current.map(m =>
                m.id === mailbox.id ? { ...m, is_favorite: !m.is_favorite } : m
            ));
            toast.success(mailbox.is_favorite ? 'Removed from favorites' : 'Added to favorites');
        } catch {
            toast.error('Failed to update favorite status');
        }
    };

    const handleToggleLogin = async (mailbox: Mailbox) => {
        try {
            await apiFetch('/api/mailboxes/toggle-login', {
                method: 'POST',
                body: JSON.stringify({ address: mailbox.address, can_login: !mailbox.can_login })
            });
            setMailboxes(current => current.map(m =>
                m.id === mailbox.id ? { ...m, can_login: !mailbox.can_login } : m
            ));
            toast.success(!mailbox.can_login ? 'Login enabled' : 'Login disabled');
        } catch {
            toast.error('Failed to update login status');
        }
    };

    const getSelectedAddresses = () => {
        return mailboxes.filter(m => selectedIds.includes(m.id)).map(m => m.address);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search mailboxes..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                    {selectedIds.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary">
                                    Batch Actions ({selectedIds.length}) <MoreHorizontal className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setBatchAction('allow')}>Allow Login</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setBatchAction('deny')}>Deny Login</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setBatchAction('favorite')}>Add to Favorites</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setBatchAction('unfavorite')}>Remove Favorites</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setBatchAction('forward')}>Set Forwarding</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setBatchAction('clear-forward')}>Clear Forwarding</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    <Select value={filterDomain} onValueChange={setFilterDomain}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Domain" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Domains</SelectItem>
                            {domains.map(d => <SelectItem key={d} value={d}>@{d}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" onClick={() => fetchMailboxes()}>
                        <RefreshCw className={isLoading ? "animate-spin" : ""} />
                    </Button>

                    <div className="border-l pl-2 ml-2 flex gap-1">
                        <Button
                            variant={viewMode === 'grid' ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode('list')}
                        >
                            <ListIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Secondary Toolbar (Filters) */}
            <div className="flex flex-wrap gap-2 items-center text-sm px-1">
                <span className="text-muted-foreground mr-2">Filters:</span>
                <Select value={filterLogin} onValueChange={setFilterLogin}>
                    <SelectTrigger className="w-[130px] h-8">
                        <SelectValue placeholder="Login Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="allowed">Allowed</SelectItem>
                        <SelectItem value="denied">Denied</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterFavorite} onValueChange={setFilterFavorite}>
                    <SelectTrigger className="w-[130px] h-8">
                        <SelectValue placeholder="Favorite" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="favorite">Favorites Only</SelectItem>
                        <SelectItem value="not-favorite">Not Favorite</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterForward} onValueChange={setFilterForward}>
                    <SelectTrigger className="w-[130px] h-8">
                        <SelectValue placeholder="Forwarding" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="has-forward">Forwarding On</SelectItem>
                        <SelectItem value="no-forward">Forwarding Off</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* List Content */}
            {mailboxes.length > 0 && (
                <div className="flex items-center gap-2 px-1 py-2">
                    <Checkbox
                        checked={selectedIds.length === mailboxes.length && mailboxes.length > 0}
                        onCheckedChange={(c) => handleSelectAll(!!c)}
                        id="select-all"
                    />
                    <label htmlFor="select-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Select All on Page
                    </label>
                </div>
            )}

            {isLoading && mailboxes.length === 0 ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : mailboxes.length === 0 ? (
                <div className="text-center py-20 border rounded-lg bg-muted/20">
                    <RefreshCw className="h-10 w-10 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">No mailboxes found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
                    {mailboxes.map(mailbox => (
                        viewMode === 'grid' ? (
                            <MailboxCard
                                key={mailbox.id}
                                mailbox={mailbox}
                                selected={selectedIds.includes(mailbox.id)}
                                onSelect={(c) => handleSelectOne(mailbox.id, c)}
                                onToggleFavorite={handleToggleFavorite}
                                onDelete={handleDelete}
                                onSetForward={setForwardMailbox}
                                onToggleLogin={handleToggleLogin}
                            />
                        ) : (
                            <MailboxListItem
                                key={mailbox.id}
                                mailbox={mailbox}
                                selected={selectedIds.includes(mailbox.id)}
                                onSelect={(c) => handleSelectOne(mailbox.id, c)}
                                onToggleFavorite={handleToggleFavorite}
                                onDelete={handleDelete}
                                onSetForward={setForwardMailbox}
                                onToggleLogin={handleToggleLogin}
                            />
                        )
                    ))}
                </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between py-4">
                <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} results
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page * pageSize >= total || isLoading}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* Modals */}
            <BatchActionModal
                open={!!batchAction}
                onOpenChange={(open) => !open && setBatchAction(null)}
                action={batchAction}
                selectedMailboxes={getSelectedAddresses()}
                onSuccess={() => {
                    fetchMailboxes();
                    setSelectedIds([]);
                }}
            />
            {forwardMailbox && (
                <ForwardMailboxDialog
                    open={!!forwardMailbox}
                    onOpenChange={(open) => !open && setForwardMailbox(null)}
                    mailbox={forwardMailbox}
                    onSuccess={(id, forwardTo) => {
                        setMailboxes(current => current.map(m =>
                            m.id === id ? { ...m, forward_to: forwardTo || undefined } : m
                        ));
                        setForwardMailbox(null);
                    }}
                />
            )}
        </div>
    );
}
