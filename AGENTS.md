# Cable a Tierra

## Propósito
Web app para que grupos de amigos registren sus partidos de fútbol amateur (6 vs 6) y acumulen estadísticas por jugador/a: partidos, goles, victorias, empates y derrotas.
MVP solo fútbol, con login de Google y organizaciones administradas. Requisitos completos en `PRD.md`.

## Stack
- Next.js 15 (App Router) + TypeScript, Node 22 LTS, npm
- Firebase: Firestore (base de datos) + Firebase Auth (solo Google)
- Firebase Emulator Suite para desarrollo local y tests (requiere Java JDK 21+)
- Tests: Vitest (unitarios) + Playwright (end-to-end)
- Hosting: Vercel

## Cómo correr
```bash
npm install
cp .env.example .env.local     # credenciales de Firebase
npx firebase emulators:start   # en otra terminal
npm run dev
npm test                       # Vitest
npm run test:e2e               # Playwright
```

## Qué NO hacer
- No implementar el borrado de organizaciones (RF-17).
- No agregar login con contraseña: solo Google (RF-18).
- No mostrar nombre completo ni fecha de nacimiento de los jugadores/as de una organización a quienes no son miembros de ella (invitados o registrados de otras organizaciones). Los miembros (admins y usuarios asociados a un jugador/a de esa organización) sí los ven. Los permisos se validan en Firestore Security Rules o en el servidor, nunca solo en la UI (RF-04, RF-06c, RF-06d, RNF-01).
- No sumar estadísticas a jugadores/as externos, es decir, los que no pertenecen a la organización (RF-20).
- No construir funcionalidades de V2 ni fuera de alcance: Elo, votación, WhatsApp, ficha para redes, invitaciones por link, otros deportes.
