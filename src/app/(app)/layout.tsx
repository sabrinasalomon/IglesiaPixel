"use client";

import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardCheck,
  HandCoins,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { Boton, Selector, Tarjeta } from "@/components/ui";
import { nombreRol } from "@/lib/catalogos";
import { puedeVer, type Modulo } from "@/lib/permisos";
import { useDatos } from "@/lib/store";
import type { Rol } from "@/lib/types";

interface Enlace {
  href: string;
  texto: string;
  icono: React.ReactNode;
  visible: (rol: Rol) => boolean;
}

const porModulo = (m: Modulo) => (rol: Rol) => puedeVer(rol, m);

const ENLACES: Enlace[] = [
  { href: "/inicio", texto: "Inicio", icono: <Home size={18} />, visible: (r) => r === "miembro" },
  { href: "/panel", texto: "Panel principal", icono: <LayoutDashboard size={18} />, visible: (r) => r !== "miembro" },
  { href: "/miembros", texto: "Miembros", icono: <Users size={18} />, visible: (r) => r !== "miembro" && puedeVer(r, "miembros") },
  { href: "/asistencia", texto: "Asistencia", icono: <ClipboardCheck size={18} />, visible: porModulo("asistencia") },
  { href: "/eventos", texto: "Eventos", icono: <CalendarDays size={18} />, visible: porModulo("eventos") },
  { href: "/ministerios", texto: "Ministerios", icono: <UsersRound size={18} />, visible: porModulo("ministerios") },
  { href: "/donaciones", texto: "Donaciones", icono: <HandCoins size={18} />, visible: porModulo("donaciones") },
  { href: "/comunicados", texto: "Comunicados", icono: <Megaphone size={18} />, visible: (r) => r !== "miembro" && puedeVer(r, "comunicados") },
  { href: "/reportes", texto: "Reportes", icono: <BarChart3 size={18} />, visible: porModulo("reportes") },
  { href: "/usuarios", texto: "Usuarios", icono: <UserCog size={18} />, visible: porModulo("usuarios") },
  { href: "/sedes", texto: "Sedes", icono: <Building2 size={18} />, visible: porModulo("sedes") },
  { href: "/configuracion", texto: "Configuración", icono: <Settings size={18} />, visible: porModulo("configuracion") },
];

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  const { usuario, db, sedeId, cambiarSede, cerrarSesion } = useDatos();
  const router = useRouter();
  const ruta = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (!usuario) router.replace("/login");
  }, [usuario, router]);
  useEffect(() => setMenuAbierto(false), [ruta]);

  if (!usuario) return null;

  const salir = async () => {
    await cerrarSesion();
    router.replace("/login");
  };

  // Cuenta creada pero todavía sin rol asignado por un administrador
  if (!usuario.activo) {
    return (
      <Aviso titulo="Tu cuenta está pendiente de activación" salir={salir}>
        Un administrador debe asignarte un rol y una sede antes de que puedas entrar.
      </Aviso>
    );
  }

  const enlaces = ENLACES.filter((e) => e.visible(usuario.rol));
  const sede = db.sedes.find((s) => s.id === sedeId);

  if (!sede && !(usuario.rol === "administrador" && ruta.startsWith("/sedes"))) {
    return usuario.rol === "administrador" ? (
      <Aviso titulo="Primero registra una sede" salir={salir}>
        Todo en el sistema pertenece a una sede.{" "}
        <Link href="/sedes" className="text-indigo-600 hover:underline">Crear la primera sede</Link>
      </Aviso>
    ) : (
      <Aviso titulo="Tu cuenta no tiene sede asignada" salir={salir}>
        Pide a un administrador que te asigne una sede.
      </Aviso>
    );
  }

  const barra = (
    <nav className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2 px-5 py-5">
        <Logo url={db.configuracion.logoUrl} />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">{db.configuracion.nombre}</p>
          <p className="text-xs text-slate-400">{sede?.nombre ?? "Sin sede"}</p>
        </div>
      </div>
      <ul className="flex-1 space-y-0.5 px-3">
        {enlaces.map((e) => {
          const activo = ruta.startsWith(e.href);
          return (
            <li key={e.href}>
              <Link
                href={e.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  activo ? "bg-slate-800 text-white" : "hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                {e.icono}
                {e.texto}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-slate-800 p-4">
        <p className="truncate text-sm font-medium text-white">{usuario.nombre}</p>
        <p className="text-xs text-slate-400">{nombreRol(usuario.rol)}</p>
        <button
          onClick={salir}
          className="mt-3 flex items-center gap-2 text-xs text-slate-400 hover:text-white"
        >
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 hidden w-64 lg:block print:hidden">{barra}</aside>
      {menuAbierto && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMenuAbierto(false)}>
          <div className="absolute inset-0 bg-slate-900/40" />
          <aside className="absolute inset-y-0 w-64" onClick={(e) => e.stopPropagation()}>{barra}</aside>
        </div>
      )}
      <div className="flex-1 lg:pl-64 print:pl-0">
        <header className="sticky top-0 z-30 flex print:hidden items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <button className="rounded p-1 lg:hidden" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
            <Menu size={20} />
          </button>
          <div className="ml-auto flex items-center gap-2">
            {usuario.rol === "administrador" ? (
              <>
                <span className="hidden text-xs text-slate-500 sm:inline">Sede</span>
                <Selector value={sedeId} onChange={(e) => cambiarSede(e.target.value)} className="w-48 py-1.5">
                  {db.sedes.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </Selector>
              </>
            ) : (
              <span className="text-sm text-slate-500">{sede?.nombre}</span>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function Aviso({ titulo, salir, children }: { titulo: string; salir: () => void; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Tarjeta className="max-w-md p-8 text-center">
        <p className="font-semibold text-slate-900">{titulo}</p>
        <p className="mt-2 text-sm text-slate-600">{children}</p>
        <Boton variante="secundario" className="mt-6" onClick={salir}>
          <LogOut size={14} /> Cerrar sesión
        </Boton>
      </Tarjeta>
    </div>
  );
}
