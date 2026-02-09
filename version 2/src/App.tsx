import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Login from '@/pages/auth/Login';
import Dashboard from '@/pages/dashboard';
import Mailbox from '@/pages/mailbox';
import ComposePage from "@/pages/mailbox/Compose";
import SentMailbox from "@/pages/mailbox/Sent";
import Layout from '@/components/layout/Layout';
import { Loader2 } from 'lucide-react';

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

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />

      <Route element={user ? <Layout /> : <Navigate to="/login" />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mailbox" element={<PrivateRoute roles={['admin', 'user', 'mailbox']}><Mailbox /></PrivateRoute>} />
        <Route path="/compose" element={<PrivateRoute roles={['admin', 'user', 'mailbox']}><ComposePage /></PrivateRoute>} />
        <Route path="/sent" element={<PrivateRoute roles={['admin', 'user', 'mailbox']}><SentMailbox /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute roles={['admin', 'user']}><div className="p-8">Settings (Work in Progress)</div></PrivateRoute>} />
        <Route index element={<Navigate to="/dashboard" />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}
