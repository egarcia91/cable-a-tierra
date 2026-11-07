"use client";

import Link from "next/link";
import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "./AuthProvider";

// Errores del popup que no son fallas: el usuario lo cerró o abrió otro.
const POPUP_DISMISSED = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];

export function LoginScreen() {
  const { user, loading, signInWithGoogle, signOutUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (loading) return <p>Cargando…</p>;
  // Mientras se registra en el servidor (RF-01b) no se muestra la sesión como iniciada.
  if (pending) return <p>Ingresando…</p>;

  if (user) {
    return (
      <section>
        <p>Hola, {user.displayName ?? user.email}.</p>
        <p>
          <Link href="/organizaciones">Ver organizaciones</Link>
        </p>
        <p>
          <Link href="/organizaciones/nueva">Crear organización</Link>
        </p>
        <button type="button" onClick={signOutUser}>
          Cerrar sesión
        </button>
      </section>
    );
  }

  async function handleGoogle() {
    setError(null);
    setPending(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      if (e instanceof FirebaseError) {
        if (!POPUP_DISMISSED.includes(e.code)) setError("No pudimos iniciar sesión. Probá de nuevo.");
      } else {
        // Error del registro en el servidor: su mensaje ya es para mostrar.
        setError((e as Error).message);
      }
    } finally {
      setPending(false);
    }
  }

  // Solo dos opciones de ingreso: Google o invitado (RF-18, AC-21).
  return (
    <section className="login">
      <button type="button" onClick={handleGoogle}>
        Iniciar sesión con Google
      </button>
      <Link href="/organizaciones" className="button-secondary">
        Ingresar como invitado
      </Link>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
