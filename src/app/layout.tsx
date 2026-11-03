import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cable a Tierra",
  description: "Anotador de partidos de fútbol entre amigos y amigas",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
