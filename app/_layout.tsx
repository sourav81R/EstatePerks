import { Stack, useRouter, usePathname, useRootNavigationState } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { VisitProvider } from '../context/VisitContext';
import TopNavbar from '../components/TopNavbar';
import { useEffect } from 'react';

function AppLayout() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const isAuthRoute = pathname?.startsWith('/auth');

  useEffect(() => {
    if (!navigationState?.key) return;

    // 🔐 Not logged in → Redirect to login
    if (!user && !isAuthRoute) {
      router.replace('/auth/login');
    }
  }, [user, isAuthRoute, navigationState?.key]);

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
