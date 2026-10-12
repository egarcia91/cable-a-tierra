# Cable a Tierra

## Propósito
Web app para que grupos de amigos registren sus partidos de fútbol amateur (6 vs 6) y acumulen estadísticas por jugador/a: partidos, goles, victorias, empates y derrotas.
MVP solo fútbol, con login de Google y organizaciones administradas. Requisitos completos en `PRD.md`.

## Stack
- Next.js 15 (App Router) + TypeScript, Node 22 LTS, npm
- Firebase: Firestore (base de datos) + Firebase Auth (solo Google)
- Firebase Emulator Suite para desarrollo local y tests
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
- No mostrar nombre completo ni fecha de nacimiento a invitados ni a quienes no son admin. Los permisos se validan en Firestore Security Rules o en el servidor, nunca solo en la UI (RF-04, RNF-01 a 03).
- No sumar estadísticas a jugadores invitados, es decir, los que no pertenecen a la organización (RF-20).
- No construir funcionalidades de V2 ni fuera de alcance: Elo, votación, WhatsApp, ficha para redes, invitaciones por link, otros deportes.
