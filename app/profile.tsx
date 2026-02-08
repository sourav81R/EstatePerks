import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useVisit } from '../context/VisitContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { points } = useVisit();
  const router = useRouter();

  // ✅ Safe user data handling
  const displayName = user?.displayName || 'EstatePerks User';
  const email = user?.email || 'Logged in via Google';
  const role = (user as any)?.role || 'user';

  const getLevel = () => {
    const pts = Number(points ?? 0);
    if (pts >= 150) return 'Gold';
    if (pts >= 50) return 'Silver';
    return 'Bronze';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      {/* Rewards Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Rewards</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Points</Text>
          <Text style={styles.value}>{points ?? 0}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Level</Text>
          <Text style={styles.level}>{getLevel()}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/')}
        >
          <Text style={styles.actionText}>🏠 Go to Home</Text>
        </TouchableOpacity>

        {role === 'agent' && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/agent/dashboard')}
          >
            <Text style={styles.actionText}>🏢 Agent Dashboard</Text>
          </TouchableOpacity>
        )}

        {role === 'admin' && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/dashboard')}
          >
            <Text style={styles.actionText}>🛡️ Admin Panel</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, styles.logoutBtn]}
          onPress={logout}
        >
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20,
  },

  header: {
    alignItems: 'center',
    marginBottom: 30,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#22d3ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatarText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#020617',
  },

  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e5e7eb',
  },

  email: {
    marginTop: 4,
    fontSize: 13,
    color: '#94a3b8',
  },

  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 26,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 14,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  label: {
    color: '#94a3b8',
    fontSize: 14,
  },

  value: {
    color: '#22d3ee',
    fontSize: 16,
    fontWeight: '700',
  },

  level: {
    color: '#facc15',
    fontSize: 15,
    fontWeight: '700',
  },

  actions: {
    gap: 14,
  },

  actionBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  actionText: {
    color: '#e5e7eb',
    fontWeight: '600',
  },

  logoutBtn: {
    backgroundColor: '#7f1d1d',
  },

  logoutText: {
    color: '#fecaca',
    fontWeight: '700',
  },
});
