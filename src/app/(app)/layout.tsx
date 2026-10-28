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

type Grupo = "General" | "Congregación" | "Finanzas" | "Administración";

interface Enlace {
  href: string;
  texto: string;
  icono: React.ReactNode;
  grupo: Grupo;
  visible: (rol: Rol) => boolean;
}

const porModulo = (m: Modulo) => (rol: Rol) => puedeVer(rol, m);

const ENLACES: Enlace[] = [
  { href: "/inicio", texto: "Inicio", icono: <Home size={18} />, grupo: "General", visible: (r) => r === "miembro" },
  { href: "/panel", texto: "Panel principal", icono: <LayoutDashboard size={18} />, grupo: "General", visible: (r) => r !== "miembro" },
  { href: "/miembros", texto: "Miembros", icono: <Users size={18} />, grupo: "Congregación", visible: (r) => r !== "miembro" && puedeVer(r, "miembros") },
  { href: "/asistencia", texto: "Asistencia", icono: <ClipboardCheck size={18} />, grupo: "Congregación", visible: porModulo("asistencia") },
  { href: "/eventos", texto: "Eventos", icono: <CalendarDays size={18} />, grupo: "Congregación", visible: porModulo("eventos") },
  { href: "/ministerios", texto: "Ministerios", icono: <UsersRound size={18} />, grupo: "Congregación", visible: porModulo("ministerios") },
  { href: "/comunicados", texto: "Comunicados", icono: <Megaphone size={18} />, grupo: "Congregación", visible: (r) => r !== "miembro" && puedeVer(r, "comunicados") },
  { href: "/donaciones", texto: "Donaciones", icono: <HandCoins size={18} />, grupo: "Finanzas", visible: porModulo("donaciones") },
  { href: "/reportes", texto: "Reportes", icono: <BarChart3 size={18} />, grupo: "Finanzas", visible: porModulo("reportes") },
  { href: "/usuarios", texto: "Usuarios", icono: <UserCog size={18} />, grupo: "Administración", visible: porModulo("usuarios") },
  { href: "/sedes", texto: "Sedes", icono: <Building2 size={18} />, grupo: "Administración", visible: porModulo("sedes") },
  { href: "/configuracion", texto: "Configuración", icono: <Settings size={18} />, grupo: "Administración", visible: porModulo("configuracion") },
];

const GRUPOS: Grupo[] = ["General", "Congregación", "Finanzas", "Administración"];

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

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
  const actual = enlaces.find((e) => ruta.startsWith(e.href));
  const sede = db.sedes.find((s) => s.id === sedeId);

  if (!sede && !(usuario.rol === "administrador" && ruta.startsWith("/sedes"))) {
    return usuario.rol === "administrador" ? (
      <Aviso titulo="Primero registra una sede" salir={salir}>
        Todo en el sistema pertenece a una sede.{" "}
        <Link href="/sedes" className="font-medium text-marca-600 hover:underline">Crear la primera sede</Link>
      </Aviso>
    ) : (
      <Aviso titulo="Tu cuenta no tiene sede asignada" salir={salir}>
        Pide a un administrador que te asigne una sede.
      </Aviso>
    );
  }

  const barra = (
    <nav className="relative flex h-full flex-col overflow-hidden bg-marca-950 text-marca-100/70">
      {/* Resplandores decorativos del fondo */}
      <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-marca-500/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-dorado-500/10 blur-3xl" />

      <div className="relative flex items-center gap-3 px-5 pb-6 pt-6">
        <Logo url={db.configuracion.logoUrl} tamano={40} />
        <div className="min-w-0 leading-tight">
          <p className="line-clamp-2 text-balance font-titulo text-[15px] font-semibold text-white">{db.configuracion.nombre}</p>
          <p className="truncate text-xs text-marca-200/60">{sede?.nombre ?? "Sin sede"}</p>
        </div>
      </div>

      <div className="relative flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {GRUPOS.map((grupo) => {
          const delGrupo = enlaces.filter((e) => e.grupo === grupo);
          if (delGrupo.length === 0) return null;
          return (
            <div key={grupo}>
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-marca-200/40">{grupo}</p>
              <ul className="space-y-0.5">
                {delGrupo.map((e) => {
                  const activo = e === actual;
                  return (
                    <li key={e.href}>
                      <Link
                        href={e.href}
                        aria-current={activo ? "page" : undefined}
                        className={`relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                          activo
                            ? "bg-white/10 text-white ring-1 ring-inset ring-white/10"
                            : "hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {activo && <span aria-hidden className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-dorado-400" />}
                        <span className={activo ? "text-dorado-300" : "text-marca-200/50"}>{e.icono}</span>
                        {e.texto}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="relative m-3 flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-inset ring-white/10">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-dorado-300 to-dorado-500 text-xs font-bold text-marca-950">
          {iniciales(usuario.nombre)}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold text-white">{usuario.nombre}</p>
          <p className="truncate text-xs text-marca-200/60">{nombreRol(usuario.rol)}</p>
        </div>
        <button
          onClick={salir}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="rounded-lg p-2 text-marca-200/60 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 hidden w-64 lg:block print:hidden">{barra}</aside>
      {menuAbierto && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMenuAbierto(false)}>
          <div className="absolute inset-0 animate-aparecer bg-slate-950/50 backdrop-blur-sm" />
          <aside className="absolute inset-y-0 w-64 animate-deslizar shadow-2xl" onClick={(e) => e.stopPropagation()}>{barra}</aside>
        </div>
      )}
      <div className="min-w-0 flex-1 lg:pl-64 print:pl-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur-md lg:px-8 print:hidden">
          <button
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          {actual && (
            <p className="truncate text-sm text-slate-400">
              <span className="hidden sm:inline">{actual.grupo} / </span>
              <span className="font-semibold text-slate-700">{actual.texto}</span>
            </p>
          )}
          <div className="ml-auto flex items-center gap-3">
            {usuario.rol === "administrador" ? (
              <label className="relative flex items-center">
                <Building2 size={15} className="pointer-events-none absolute left-3 text-slate-400" />
                <span className="sr-only">Sede</span>
                <Selector value={sedeId} onChange={(e) => cambiarSede(e.target.value)} className="w-48 py-1.5 pl-9">
                  {db.sedes.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </Selector>
              </label>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <Building2 size={13} /> {sede?.nombre}
              </span>
            )}
            <span
              title={`${usuario.nombre} · ${nombreRol(usuario.rol)}`}
              className="hidden h-8 w-8 items-center justify-center rounded-full bg-marca-600 text-xs font-bold text-white ring-2 ring-marca-100 sm:flex"
            >
              {iniciales(usuario.nombre)}
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-7xl animate-aparecer px-4 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function Aviso({ titulo, salir, children }: { titulo: string; salir: () => void; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-marca-50 via-white to-dorado-50 p-4">
      <Tarjeta className="max-w-md p-8 text-center">
        <p className="font-titulo text-xl font-semibold text-slate-900">{titulo}</p>
        <p className="mt-2 text-sm text-slate-600">{children}</p>
        <Boton variante="secundario" className="mt-6" onClick={salir}>
          <LogOut size={14} /> Cerrar sesión
        </Boton>
      </Tarjeta>
    </div>
  );
}
