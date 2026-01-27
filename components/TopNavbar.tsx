import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

type NavProps = {
  label: string;
  path: string;
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  isMobile: boolean;
};

export default function TopNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth(); // ✅ NOW SAFE
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const slideAnim = useRef(new Animated.Value(-15)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path);

  return (
    <View style={[styles.container, isMobile && styles.mobileContainer]}>
      <TouchableOpacity onPress={() => router.push('/')}>
        <Animated.Text
          style={[
            styles.logo,
            isMobile && styles.mobileLogo,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {isMobile ? 'E' : 'Estate'}<Text style={styles.logoAccent}>{isMobile ? 'P' : 'Perks'}</Text>
        </Animated.Text>
      </TouchableOpacity>

      <View style={[styles.links, isMobile && styles.mobileLinks]}>
        <Nav label="Properties" path="/" active={isActive('/')} icon="business" isMobile={isMobile} />
        <Nav label="Rewards" path="/rewards" active={isActive('/rewards')} icon="gift" isMobile={isMobile} />
        <Nav label="Explore" path="/explore" active={isActive('/explore')} icon="map" isMobile={isMobile} />

        <TouchableOpacity onPress={logout} style={[styles.logoutBtn, isMobile && styles.mobileLogoutBtn]}>
          {isMobile ? (
            <Ionicons name="log-out-outline" size={20} color="#fecaca" />
          ) : (
            <Text style={styles.logoutText}>Logout</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Nav({ label, path, active, icon, isMobile }: NavProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(path as any)}
      style={[styles.navItem, active && styles.activeItem, isMobile && styles.mobileNavItem]}
    >
      {isMobile ? (
        <Ionicons name={icon} size={22} color={active ? '#22d3ee' : '#cbd5f5'} />
      ) : (
        <Text style={[styles.link, active && styles.activeLink]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 72,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingHorizontal: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobileContainer: {
    height: 64,
    paddingHorizontal: 16,
  },
  logo: {
    fontSize: 26,
    fontWeight: '900',
    color: '#e5e7eb',
  },
  mobileLogo: {
    fontSize: 22,
  },
  logoAccent: {
    color: '#22d3ee',
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mobileLinks: {
    gap: 8,
  },
  navItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  activeItem: {
    backgroundColor: '#1e293b',
  },
  mobileNavItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  link: {
    color: '#cbd5f5',
    fontWeight: '600',
  },
  activeLink: {
    color: '#22d3ee',
  },
  logoutBtn: {
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mobileLogoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#fecaca',
    fontWeight: '700',
  },
});
