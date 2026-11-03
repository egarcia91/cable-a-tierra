"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { registerUser } from "@/app/actions/auth";

type AuthState = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (current) => {
        setUser(current);
        setLoading(false);
      }),
    [],
  );

  async function signInWithGoogle() {
    const { user: signedIn } = await signInWithPopup(auth, new GoogleAuthProvider());
    // Sin registro no hay sesión: si el servidor falla (o no responde), se cierra.
    const result = await registerUser(await signedIn.getIdToken()).catch(() => ({
      ok: false as const,
      error: "No pudimos registrarte. Probá de nuevo.",
    }));
    if (!result.ok) {
      await signOut(auth);
      throw new Error(result.error);
    }
  }

  async function signOutUser() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth tiene que usarse dentro de <AuthProvider>");
  return value;
}
