
import * as AuthSession from 'expo-auth-session';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  /* 🔐 GOOGLE AUTH (WEB CLIENT ONLY) */
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:
      '301363433740-d540l2p8i6don868nltq9151v2cmtaod.apps.googleusercontent.com',
  });

  /* ✅ Handle Google response */
  useEffect(() => {
  if (response?.type === 'success') {
    login({
      name: 'Google User',
    });
    router.replace('/');
  }
}, [response]);


  /* ✅ Manual login validation */
  const handleLogin = () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setError('');
    login({ name: email });
    router.replace('/');
  };

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        {/* Brand */}
        <Text style={styles.brand}>
          Estate<Text style={styles.brandAccent}>Perks</Text>
        </Text>

        <Text style={styles.subtitle}>
          Sign in to explore premium properties
        </Text>

        {/* Error */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordWrap}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#94a3b8"
            />
          </TouchableOpacity>
        </View>

        {/* Sign In */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
          <Text style={styles.primaryText}>Sign In</Text>
        </TouchableOpacity>

        {/* Google Sign In */}
        <TouchableOpacity
          style={styles.googleBtn}
          disabled={!request}
          onPress={() => promptAsync()}
        >
          <Ionicons name="logo-google" size={18} color="#ea4335" />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 26,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },

  brand: {
    fontSize: 30,
    fontWeight: '900',
    color: '#e5e7eb',
    marginBottom: 6,
  },

  brandAccent: {
    color: '#22d3ee',
  },

  subtitle: {
    color: '#94a3b8',
    marginBottom: 24,
    fontSize: 14,
  },

  error: {
    color: '#f87171',
    marginBottom: 12,
    fontSize: 13,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    color: '#e5e7eb',
  },

  input: {
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#020617',
    color: '#e5e7eb',
  },

  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    backgroundColor: '#020617',
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    color: '#e5e7eb',
  },

  primaryBtn: {
    backgroundColor: '#22d3ee',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },

  primaryText: {
    color: '#020617',
    fontWeight: '800',
    fontSize: 15,
  },

  googleBtn: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 15,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
  },

  googleText: {
    fontWeight: '600',
    color: '#e5e7eb',
  },
});
