import { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import toast from 'react-hot-toast';

export interface SendEmailPayload {
    from: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
    fromName?: string;
    scheduledAt?: string;
}

export interface SentEmail {
    id: number;
    resend_id: string;
    recipients: string;
    subject: string;
    created_at: string;
    status: string;
}

export function useSender() {
    const [isSending, setIsSending] = useState(false);
    const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
    const [isLoadingSent, setIsLoadingSent] = useState(false);

    const sendEmail = useCallback(async (payload: SendEmailPayload) => {
        setIsSending(true);
        try {
            const res = await apiFetch<Record<string, unknown>>('/api/send', { // api return type is dynamic
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.success) {
                toast.success('Email sent successfully');
                return true;
            } else {
                toast.error(String(res.error) || 'Failed to send email');
                return false;
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to send email';
            toast.error(msg);
            return false;
        } finally {
            setIsSending(false);
        }
    }, []);

    const fetchSentEmails = useCallback(async (fromAddress: string) => {
        setIsLoadingSent(true);
        try {
            const res = await apiFetch<SentEmail[]>(`/api/sent?from=${encodeURIComponent(fromAddress)}&limit=50`);
            if (Array.isArray(res)) {
                setSentEmails(res);
            }
        } catch (error) {
            console.error('Failed to fetch sent emails', error);
            // toast.error('Failed to load sent emails'); 
        } finally {
            setIsLoadingSent(false);
        }
    }, []);

    return {
        sendEmail,
        fetchSentEmails,
        sentEmails,
        isSending,
        isLoadingSent
    };
}
