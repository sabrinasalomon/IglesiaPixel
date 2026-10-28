import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { ProveedorDatos } from "@/lib/store";
import "./globals.css";

const texto = Inter({ subsets: ["latin"], variable: "--fuente-texto", display: "swap" });
const titulo = Fraunces({ subsets: ["latin"], variable: "--fuente-titulo", display: "swap" });

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
