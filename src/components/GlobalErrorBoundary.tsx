import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="flex justify-center flex-col items-center space-y-4">
          <div className="bg-destructive/10 p-4 rounded-full">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
        </div>
        
        <div className="bg-muted p-4 rounded-md text-left overflow-auto max-h-[300px]">
          <p className="text-sm font-mono text-muted-foreground break-all">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={resetErrorBoundary} variant="default">
            Try again
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}

export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state of your app so the error doesn't happen again
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
