import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  signIn as apiSignIn,
  signInWithGoogle as apiSignInWithGoogle,
  signUp as apiSignUp,
} from "../api/client";
import { AUTH_ENABLED } from "../config";
import { getGoogleIdToken, signOutGoogle } from "./googleSignIn";
import {
  clearSession,
  loadSession,
  saveSession,
  type StoredUser,
} from "./storage";

interface AuthContextValue {
  user: StoredUser | null;
  token: string | null;
  ready: boolean;
  signIn: (mail: string, password: string) => Promise<void>;
  signUp: (mail: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!AUTH_ENABLED) {
      clearSession()
        .catch(() => {})
        .finally(() => setReady(true));
      return;
    }

    loadSession()
      .then((session) => {
        if (session) {
          setToken(session.token);
          setUser(session.user);
        }
      })
      .catch(() => {
        /* storage unavailable — start signed out */
      })
      .finally(() => setReady(true));
  }, []);

  const applySession = useCallback(async (nextToken: string, nextUser: StoredUser) => {
    await saveSession(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const signIn = useCallback(
    async (mail: string, password: string) => {
      const { token: nextToken, user: nextUser } = await apiSignIn(mail, password);
      await applySession(nextToken, nextUser);
    },
    [applySession],
  );

  const signUp = useCallback(
    async (mail: string, password: string) => {
      const { token: nextToken, user: nextUser } = await apiSignUp(mail, password);
      await applySession(nextToken, nextUser);
    },
    [applySession],
  );

  const signInWithGoogle = useCallback(async () => {
    const idToken = await getGoogleIdToken();
    const { token: nextToken, user: nextUser } =
      await apiSignInWithGoogle(idToken);
    await applySession(nextToken, nextUser);
  }, [applySession]);

  const signOut = useCallback(async () => {
    await signOutGoogle();
    await clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [user, token, ready, signIn, signUp, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
