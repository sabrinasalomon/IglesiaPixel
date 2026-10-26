import type { Metadata } from "next";
import { ProveedorDatos } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestión de Iglesias",
  description: "Sistema de gestión para iglesias con varias sedes",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body className="antialiased">
        <ProveedorDatos>{children}</ProveedorDatos>
      </body>
    </html>
  );
}
