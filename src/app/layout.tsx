import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cable a Tierra",
  description: "Anotador de partidos de fútbol entre amigos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
