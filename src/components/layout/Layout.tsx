import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Mail,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    PenSquare,
    Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
    children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    const navItems = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'user'] },
        { to: '/compose', label: 'Compose', icon: PenSquare, roles: ['admin', 'user', 'mailbox'] },
        { to: '/mailbox', label: 'Inbox', icon: Mail, roles: ['admin', 'user', 'mailbox'] },
        { to: '/sent', label: 'Sent', icon: Send, roles: ['admin', 'user', 'mailbox'] },
        { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'user'] },
    ];

    const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role || ''));

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-full flex flex-col">
                    <div className="h-16 flex items-center px-6 border-b">
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            Open-Temp-Mail
                        </span>
                    </div>

                    <div className="flex-1 py-6 px-4 space-y-1">
                        {filteredNavItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </NavLink>
                        ))}
                    </div>

                    <div className="p-4 border-t space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">{user?.username}</p>
                                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => logout()}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b flex items-center px-4 lg:px-8 justify-between lg:justify-end bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/20 sticky top-0 z-30">
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
                        {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </header>

                <div className="flex-1">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    );
}
