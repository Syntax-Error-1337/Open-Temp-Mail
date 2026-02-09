import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Mail, RefreshCw, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface GeneratedEmail {
    email: string;
    expires: number;
}

export function TempMailGenerator() {
    const [generatedEmail, setGeneratedEmail] = useState<string>('');
    const [customLocal, setCustomLocal] = useState('');
    const [domains, setDomains] = useState<string[]>([]);
    const [selectedDomain, setSelectedDomain] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchDomains = async () => {
            try {
                const data = await apiFetch<string[]>('/api/domains');
                if (Array.isArray(data) && data.length > 0) {
                    setDomains(data);
                    setSelectedDomain(data[0]);
                }
            } catch (error) {
                console.error('Failed to fetch domains', error);
                toast.error('Failed to load domains');
            }
        };

        fetchDomains();
    }, []);

    const handleRandomGenerate = async () => {
        setIsGenerating(true);
        try {
            // Find index of selected domain
            const domainIndex = domains.indexOf(selectedDomain);
            const idx = domainIndex >= 0 ? domainIndex : 0;

            const data = await apiFetch<GeneratedEmail>(`/api/generate?length=8&domainIndex=${idx}`);
            if (data?.email) {
                setGeneratedEmail(data.email);
                toast.success('Random email generated!');
            }
        } catch (error) {
            console.error('Failed to generate email', error);
            toast.error('Failed to generate email');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCustomCreate = async () => {
        if (!customLocal.trim()) {
            toast.error('Please enter a local part');
            return;
        }

        if (!/^[a-z0-9._-]{1,64}$/i.test(customLocal.trim())) {
            toast.error('Invalid format. Use only letters, numbers, dots, hyphens, and underscores');
            return;
        }

        setIsCreating(true);
        try {
            // Find index of selected domain
            const domainIndex = domains.indexOf(selectedDomain);
            const idx = domainIndex >= 0 ? domainIndex : 0;

            const data = await apiFetch<GeneratedEmail>('/api/create', {
                method: 'POST',
                body: JSON.stringify({
                    local: customLocal.trim(),
                    domainIndex: idx
                })
            });

            if (data?.email) {
                setGeneratedEmail(data.email);
                setCustomLocal('');
                toast.success('Custom email created!');
            }
        } catch (error) {
            console.error('Failed to create email', error);
            toast.error('Failed to create email');
        } finally {
            setIsCreating(false);
        }
    };

    const handleCopy = () => {
        if (generatedEmail) {
            navigator.clipboard.writeText(generatedEmail);
            toast.success('Email copied to clipboard!');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Temp Mail Generator
                </CardTitle>
                <CardDescription>
                    Generate temporary email addresses for testing or privacy
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Tabs defaultValue="random" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="random">Random</TabsTrigger>
                        <TabsTrigger value="custom">Custom</TabsTrigger>
                    </TabsList>

                    <TabsContent value="random" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Generate Random Email</Label>
                            <p className="text-sm text-muted-foreground">
                                Click the button below to generate a random temporary email address
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Domain:</span>
                                <Select value={selectedDomain} onValueChange={setSelectedDomain} disabled={domains.length === 0}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select domain" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {domains.map((domain) => (
                                            <SelectItem key={domain} value={domain}>
                                                {domain}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button
                            onClick={handleRandomGenerate}
                            disabled={isGenerating || domains.length === 0}
                            className="w-full"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generate Random Email
                                </>
                            )}
                        </Button>
                    </TabsContent>

                    <TabsContent value="custom" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="custom-local">Custom Email Address</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="custom-local"
                                    placeholder="yourname"
                                    value={customLocal}
                                    onChange={(e) => setCustomLocal(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleCustomCreate();
                                        }
                                    }}
                                />
                                <span className="flex items-center text-muted-foreground">@</span>
                                <Select value={selectedDomain} onValueChange={setSelectedDomain} disabled={domains.length === 0}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select domain" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {domains.map((domain) => (
                                            <SelectItem key={domain} value={domain}>
                                                {domain}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Use letters, numbers, dots, hyphens, and underscores (1-64 characters)
                            </p>
                        </div>
                        <Button
                            onClick={handleCustomCreate}
                            disabled={isCreating || domains.length === 0}
                            className="w-full"
                        >
                            {isCreating ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Create Custom Email
                                </>
                            )}
                        </Button>
                    </TabsContent>
                </Tabs>

                {generatedEmail && (
                    <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                        <Label className="text-sm font-medium">Generated Email</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                value={generatedEmail}
                                readOnly
                                className="font-mono bg-background"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleCopy}
                                title="Copy to clipboard"
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Click the copy button to copy the email address to your clipboard
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
