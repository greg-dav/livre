import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type User } from '../lib/api';

const TOKEN_KEY = 'livre_token';
const REAL_TOKEN_KEY = 'livre_real_token';
const DEMO_KEY = 'livre_demo';

interface AuthState {
  user: User | null;
  loading: boolean;
  /** True while the session is the isolated demo sandbox rather than the real account. */
  demo: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  /** Switch into the demo sandbox, stashing the real session so it can be restored on exit. */
  enterDemo: () => Promise<void>;
  /** Leave the demo sandbox and restore the real session. */
  exitDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Manages authentication state for the entire app. On mount, validates any token stored in
 * localStorage against /api/auth/me so sessions survive page reloads. Exposes login/logout
 * helpers that keep localStorage and React state in sync. Must wrap any component that calls
 * useAuth.
 *
 * Demo mode is a session swap, not a separate app: entering stashes the real token under a second
 * key and runs on a demo-user token, so every existing data hook keeps working unchanged against
 * the demo user's isolated rows; exiting restores the real token. The demo flag persists across
 * reloads so a refresh mid-demo stays in the sandbox.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(() => localStorage.getItem(DEMO_KEY) === '1');

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api.account
      .me()
      .then((u) => setUser(u))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = (token: string, u: User) => {
    localStorage.removeItem(REAL_TOKEN_KEY);
    localStorage.removeItem(DEMO_KEY);
    localStorage.setItem(TOKEN_KEY, token);
    setDemo(false);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REAL_TOKEN_KEY);
    localStorage.removeItem(DEMO_KEY);
    setDemo(false);
    setUser(null);
  };

  const enterDemo = async () => {
    const { token, user: demoUser } = await api.demo.enter();
    const real = localStorage.getItem(TOKEN_KEY);
    if (real) localStorage.setItem(REAL_TOKEN_KEY, real);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(DEMO_KEY, '1');
    setDemo(true);
    setUser(demoUser);
  };

  const exitDemo = async () => {
    const real = localStorage.getItem(REAL_TOKEN_KEY);
    localStorage.removeItem(REAL_TOKEN_KEY);
    localStorage.removeItem(DEMO_KEY);
    setDemo(false);
    if (!real) {
      logout();
      return;
    }
    localStorage.setItem(TOKEN_KEY, real);
    const u = await api.account.me();
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, demo, login, logout, enterDemo, exitDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
