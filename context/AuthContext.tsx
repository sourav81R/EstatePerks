import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ---------------- TYPES ---------------- */

type User = {
  name: string;
  displayName?: string;
  email?: string;
  role?: 'user' | 'agent' | 'admin';
};

type AuthContextType = {
  user: User | null;
  authLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  register?: (email: string, password: string, name: string, role?: 'user' | 'agent' | 'admin') => Promise<void>;
};

/* ---------------- CONTEXT ---------------- */

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

/* ---------------- PROVIDER ---------------- */

type AuthProviderProps = {
  children: ReactNode;
};

const AUTH_STORAGE_KEY = '@estateperks_user';

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const restoreAuth = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (savedUser && mounted) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.warn('Failed to restore auth session:', error);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    restoreAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData)).catch(() => {});
  };

  const logout = () => {
    setUser(null);
    AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => {});
  };

  const register = async (
    email: string,
    _password: string,
    name: string,
    role: 'user' | 'agent' | 'admin' = 'user'
  ) => {
    const newUser: User = {
      name,
      displayName: name,
      email,
      role,
    };

    setUser(newUser);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ---------------- HOOK ---------------- */

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}
