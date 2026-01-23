import { Stack, Redirect, usePathname } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { VisitProvider } from '../context/VisitContext';
import TopNavbar from '../components/TopNavbar';

function AppLayout() {
  const { user } = useAuth();
  const pathname = usePathname();

  const isAuthRoute = pathname.startsWith('/auth');

  // 🔐 Not logged in → ONLY allow auth routes
  if (!user && !isAuthRoute) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <VisitProvider>
      <Stack
        screenOptions={{
          header: isAuthRoute ? () => null : () => <TopNavbar />,
        }}
      />
    </VisitProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}
