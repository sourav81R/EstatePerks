import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { VisitProvider } from '../context/VisitContext';
import TopNavbar from '../components/TopNavbar';
import { useEffect } from 'react';

function AppLayout() {
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const isAuthRoute = segments[0] === 'auth';

  useEffect(() => {
    if (!navigationState?.key) return;

    // 🔐 Not logged in → Redirect to login
    if (!user && !isAuthRoute) {
      // Use a timeout to ensure the navigator is fully mounted before navigating
      const timer = setTimeout(() => {
        router.replace('/auth/login');
      }, 0);
      return () => clearTimeout(timer);
    }
    if (user && isAuthRoute) {
      router.replace('/');
    }
  }, [user, isAuthRoute, navigationState?.key, router]);

  return (
    <Stack
      screenOptions={{
        header: isAuthRoute ? () => null : () => <TopNavbar />,
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <VisitProvider>
        <AppLayout />
      </VisitProvider>
    </AuthProvider>
  );
}
