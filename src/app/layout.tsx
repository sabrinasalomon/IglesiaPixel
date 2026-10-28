import type { Metadata } from "next";
import { Nunito, Pixelify_Sans } from "next/font/google";
import { ProveedorDatos } from "@/lib/store";
import "./globals.css";

// Pixelify Sans, letra pixelada pero legible, para títulos y cifras; Nunito,
// redonda y clara en tamaños chicos, para la interfaz y las tablas.
const texto = Nunito({ subsets: ["latin"], variable: "--fuente-texto", display: "swap" });
const titulo = Pixelify_Sans({ subsets: ["latin"], variable: "--fuente-titulo", display: "swap" });

export const metadata: Metadata = {
  title: "Gestión de Iglesias",
  description: "Sistema de gestión para iglesias con varias sedes",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX" className={`${texto.variable} ${titulo.variable}`}>
      <body className="antialiased">
        <ProveedorDatos>{children}</ProveedorDatos>
      </body>
    </html>
  );
}
