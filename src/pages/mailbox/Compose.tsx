import { ComposeEmail } from '@/components/shared/ComposeEmail';
import { useNavigate } from 'react-router-dom';

export default function ComposePage() {
    const navigate = useNavigate();

    return (
        <div className="container max-w-2xl py-8">
            <h1 className="text-2xl font-bold mb-6">Compose New Email</h1>
            <ComposeEmail onClose={() => navigate('/sent')} />
        </div>
    );
}
