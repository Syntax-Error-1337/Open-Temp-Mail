import { ComposeEmail } from '@/components/shared/ComposeEmail';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ComposePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const initialValues = location.state as { to?: string; subject?: string; body?: string } | undefined;

    return (
        <div className="container max-w-2xl py-8">
            <h1 className="text-2xl font-bold mb-6">
                {initialValues?.to ? 'Reply to Email' : 'Compose New Email'}
            </h1>
            <ComposeEmail 
                onClose={() => navigate('/sent')} 
                initialValues={initialValues}
            />
        </div>
    );
}
