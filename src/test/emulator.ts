// Helpers para los tests que corren contra los emuladores.
const PROJECT_ID = "demo-cable-a-tierra";

export async function clearFirestore(): Promise<void> {
  const res = await fetch(
    `http://127.0.0.1:8080/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error(`No se pudo limpiar Firestore: ${res.status}`);
}

const identityToolkit = (method: string, body: object) =>
  fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:${method}?key=fake-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(async (res) => {
    const json = await res.json();
    if (!res.ok) throw new Error(`Auth emulator ${method}: ${JSON.stringify(json)}`);
    return json as { idToken: string; localId: string };
  });

// Simula un login con Google: el emulador acepta un id_token sin firmar.
export function signInWithGoogle(user: { sub: string; email: string; name: string }) {
  const idToken = JSON.stringify({ ...user, email_verified: true });
  return identityToolkit("signInWithIdp", {
    postBody: `id_token=${encodeURIComponent(idToken)}&providerId=google.com`,
    requestUri: "http://localhost",
    returnSecureToken: true,
  });
}

export function signUpWithPassword(email: string) {
  return identityToolkit("signUp", { email, password: "secreto123", returnSecureToken: true });
}

export async function clearAuth(): Promise<void> {
  const res = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT_ID}/accounts`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`No se pudo limpiar Auth: ${res.status}`);
}
