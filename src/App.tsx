import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Login from '@/pages/auth/Login';
import Dashboard from '@/pages/dashboard';
import Mailbox from '@/pages/mailbox';
import ComposePage from "@/pages/mailbox/Compose";
import SentMailbox from "@/pages/mailbox/Sent";
import Layout from '@/components/layout/Layout';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient();

const PrivateRoute = ({ children, roles = [] }: { children: React.ReactNode, roles?: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check if user has any of the required roles
  if (roles.length > 0 && user.role && !roles.includes(user.role)) {
    // Or handle unauthorized access differently, e.g., show an error page
    return <Navigate to="/dashboard" />; // Redirect to dashboard if unauthorized
  }

  return <>{children}</>;
};

const AuthenticatedRoute = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <AuthenticatedRoute />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "mailbox",
        element: <PrivateRoute roles={['admin', 'user', 'mailbox']}><Mailbox /></PrivateRoute>,
      },
      {
        path: "compose",
        element: <PrivateRoute roles={['admin', 'user', 'mailbox']}><ComposePage /></PrivateRoute>,
      },
      {
        path: "sent",
        element: <PrivateRoute roles={['admin', 'user', 'mailbox']}><SentMailbox /></PrivateRoute>,
      },
      {
        path: "settings",
        element: <PrivateRoute roles={['admin', 'user']}><div className="p-8">Settings (Work in Progress)</div></PrivateRoute>,
      }
    ]
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />
  }
]);

export default function App() {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" />
        </AuthProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}
