import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch } from '../lib/api';

interface User {
    role: 'admin' | 'user' | 'guest' | 'mailbox';
    username: string;
    mailboxAddress?: string;
    can_send?: number;
    mailbox_limit?: number;
    id?: number;
    userId?: number;
    mailDomain?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (data: Record<string, unknown>) => Promise<void>;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);


    const checkSession = async () => {
        try {
            const data = await apiFetch<User>('/api/session');
            if (data && data.role) {
                setUser(data);
            } else {
                setUser(null);
            }
        } catch (error: any) {
            // 401 Unauthorized is expected if not logged in
            if (error.status === 401) {
                setUser(null);
            } else {
                console.error('Session check failed:', error);
                setUser(null);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkSession();
    }, []);

    const login = async (data: Record<string, unknown>) => {
        const response = await apiFetch<{ success: boolean; message?: string }>('/api/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (response.success) {
            await checkSession();
        } else {
            throw new Error(response.message || 'Login failed');
        }
    };

    const logout = async () => {
        try {
            await apiFetch('/api/logout', { method: 'POST' });
        } finally {
            setUser(null);
            window.location.href = '/'; // Hard reload to clear state
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, checkSession }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
