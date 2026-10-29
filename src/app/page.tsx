import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { LoginButton, LogoutButton } from "./auth-buttons";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main>
      <h1>Cable a Tierra</h1>
      {user ? (
        <>
          <p>Hola, {user.name}</p>
          <Link href="/organizaciones/nueva">Crear organización</Link>
          <LogoutButton />
        </>
      ) : (
        <LoginButton />
      )}
    </main>
  );
}
