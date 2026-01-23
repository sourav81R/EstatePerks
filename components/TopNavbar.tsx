import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

type NavProps = {
  label: string;
  path: string;
  active: boolean;
};

export default function TopNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth(); // ✅ NOW SAFE

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
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push('/')}>
        <Animated.Text
          style={[
            styles.logo,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          Estate<Text style={styles.logoAccent}>Perks</Text>
        </Animated.Text>
      </TouchableOpacity>

      <View style={styles.links}>
        <Nav label="Properties" path="/" active={isActive('/')} />
        <Nav label="Rewards" path="/rewards" active={isActive('/rewards')} />
        <Nav label="Explore" path="/explore" active={isActive('/explore')} />

        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Nav({ label, path, active }: NavProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(path as any)}
      style={[styles.navItem, active && styles.activeItem]}
    >
      <Text style={[styles.link, active && styles.activeLink]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 72,
    backgroundColor: '#020617',
    paddingHorizontal: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 26,
    fontWeight: '900',
    color: '#e5e7eb',
  },
  logoAccent: {
    color: '#22d3ee',
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  activeItem: {
    backgroundColor: '#0f172a',
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
  logoutText: {
    color: '#fecaca',
    fontWeight: '700',
  },
});
