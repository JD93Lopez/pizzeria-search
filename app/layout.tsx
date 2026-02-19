import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pizzeria Search - Asistente Inteligente",
  description: "Sistema de búsqueda inteligente de productos de pizzería",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
