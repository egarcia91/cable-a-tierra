"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, inMemoryPersistence, setPersistence, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { login, logout } from "./actions/auth";

export function LoginButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleClick = () =>
    startTransition(async () => {
      setError(null);
      try {
        // La sesión vive en la cookie del servidor; el cliente no guarda nada.
        await setPersistence(auth, inMemoryPersistence);
        const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
        const result = await login(await user.getIdToken());
        await signOut(auth);
        if (result.error) setError(result.error);
        else router.refresh();
      } catch {
        setError("No se pudo iniciar sesión con Google.");
      }
    });

  return (
    <div>
      <button onClick={handleClick} disabled={pending}>
        {pending ? "Ingresando…" : "Ingresar con Google"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await logout();
          router.refresh();
        })
      }
    >
      Cerrar sesión
    </button>
  );
}
