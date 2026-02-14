import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter, usePathname, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing, 
  interpolateColor 
} from 'react-native-reanimated';

type NavProps = {
  label: string;
  path: string;
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  isMobile: boolean;
  isCompact: boolean;
};

const ShimmerChar = ({ char, index, total, isAccent, isMobile }: { char: string, index: number, total: number, isAccent: boolean, isMobile: boolean }) => {
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const baseColor = isAccent ? '#fbbf24' : '#ffffff';
    const offset = index / total;
    const color = interpolateColor(
      (shimmerValue.value + offset) % 1,
      [0, 0.1, 0.2, 1],
      [baseColor, '#fff', baseColor, baseColor]
    );
    return { color };
  });

  return (
    <Reanimated.Text style={[styles.logo, isMobile && styles.mobileLogo, isAccent && styles.logoAccent, { letterSpacing: 0, marginLeft: index === 0 ? 0 : -1.5 }, animatedStyle]}>
      {char}
    </Reanimated.Text>
  );
};

export default function TopNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isCompact = width < 380;

  const { view } = useLocalSearchParams<{ view?: string }>();
  const isPropertiesView = view === 'properties';

  const slideAnim = useRef(new Animated.Value(-15)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const isActive = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(path));

  return (
    <View style={[styles.container, isMobile && styles.mobileContainer, isCompact && styles.compactContainer]}>
      <TouchableOpacity onPress={() => router.push('/')} style={styles.logoContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Ionicons name="business" size={isCompact ? 22 : 26} color="#fbbf24" style={styles.logoIcon} />
        </Animated.View>
        <Animated.View
          style={[
            styles.logoTextWrapper,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {(isMobile ? 'EP' : 'EstatePerks').split('').map((char, index) => (
            <ShimmerChar 
              key={index} 
              char={char} 
              index={index} 
              total={isMobile ? 2 : 11} 
              isAccent={index >= (isMobile ? 1 : 6)}
              isMobile={isMobile}
            />
          ))}
        </Animated.View>
      </TouchableOpacity>

      <View style={[styles.links, isMobile && styles.mobileLinks, isCompact && styles.compactLinks]}>
        <Nav label="Home" path="/" active={pathname === '/' && !isPropertiesView} icon="home" isMobile={isMobile} isCompact={isCompact} />
        <Nav label="Property Details" path="/property/1" active={isPropertiesView || pathname.startsWith('/property')} icon="business" isMobile={isMobile} isCompact={isCompact} />
        <Nav label="Rewards" path="/rewards" active={isActive('/rewards')} icon="gift" isMobile={isMobile} isCompact={isCompact} />
        <Nav label="Explore" path="/explore" active={isActive('/explore')} icon="map" isMobile={isMobile} isCompact={isCompact} />

        <TouchableOpacity onPress={logout} style={[styles.logoutBtn, isMobile && styles.mobileLogoutBtn, isCompact && styles.compactLogoutBtn]}>
          {isMobile ? (
            <Ionicons name="log-out-outline" size={isCompact ? 18 : 20} color="#fecaca" />
          ) : (
            <Text style={styles.logoutText}>Logout</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Nav({ label, path, active, icon, isMobile, isCompact }: NavProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(path as any)}
    >
      {({ hovered }) => (
        <View style={[
          styles.navItem, 
          active && styles.activeItem, 
          isMobile && styles.mobileNavItem,
          isCompact && styles.compactNavItem,
          hovered && Platform.OS === 'web' && styles.navHover
        ]}>
          {isMobile ? (
            <Ionicons 
              name={icon} 
              size={isCompact ? 20 : 22} 
              color={active ? '#22d3ee' : (hovered && Platform.OS === 'web' ? '#fbbf24' : '#cbd5f5')} 
            />
          ) : (
            <Text style={[
              styles.link, 
              active && styles.activeLink,
              hovered && Platform.OS === 'web' && styles.linkHover
            ]}>
              {label}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 74,
    backgroundColor: '#081321',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2d45',
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '0 10px 30px rgba(2, 6, 23, 0.35)' } : {}),
  },
  mobileContainer: {
    height: 66,
    paddingHorizontal: 16,
  },
  compactContainer: {
    paddingHorizontal: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    marginRight: 10,
    textShadowColor: 'rgba(251, 191, 36, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  logo: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1.5,
  },
  mobileLogo: {
    fontSize: 24,
  },
  logoAccent: {
    color: '#fbbf24',
    textShadowColor: 'rgba(251, 191, 36, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mobileLinks: {
    gap: 8,
  },
  compactLinks: {
    gap: 4,
  },
  navItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeItem: {
    backgroundColor: '#12233a',
    borderColor: '#2b3d5c',
  },
  mobileNavItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  compactNavItem: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  link: {
    color: '#b9c8da',
    fontWeight: '600',
    transitionProperty: 'color',
    transitionDuration: '0.2s',
  },
  linkHover: {
    color: '#fbbf24',
  },
  activeLink: {
    color: '#22d3ee',
  },
  logoutBtn: {
    backgroundColor: '#3a1015',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  mobileLogoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  compactLogoutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  logoutText: {
    color: '#fecaca',
    fontWeight: '700',
  },
  navHover: {
    backgroundColor: 'rgba(34, 211, 238, 0.09)',
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
});
