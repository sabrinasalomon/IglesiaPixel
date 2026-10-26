"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { generarDatos, iso, type BaseDatos } from "./datos-ejemplo";
import type { Usuario } from "./types";

// Almacén del prototipo: datos ficticios en memoria + sesión de demostración.
// En la Fase 1 se reemplaza por Supabase (auth + consultas por sede).

interface Contexto {
  db: BaseDatos;
  actualizar: (cambio: (db: BaseDatos) => BaseDatos) => void;
  usuario: Usuario | null;
  iniciarSesion: (usuarioId: string) => void;
  cerrarSesion: () => void;
  sedeId: string;
  cambiarSede: (sedeId: string) => void;
  hoy: string;
}

const Ctx = createContext<Contexto | null>(null);
const CLAVE_SESION = "gi-sesion";

export function ProveedorDatos({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<BaseDatos | null>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [sedeId, setSedeId] = useState("s1");
  const [hoy, setHoy] = useState("");

  // Los datos dependen de la fecha actual, así que se generan en el navegador
  useEffect(() => {
    const ahora = new Date();
    setHoy(iso(ahora));
    setDb(generarDatos(ahora));
    try {
      const guardada = JSON.parse(localStorage.getItem(CLAVE_SESION) ?? "null");
      if (guardada) {
        setUsuarioId(guardada.usuarioId);
        setSedeId(guardada.sedeId);
      }
    } catch {
      // sin sesión guardada
    }
  }, []);

  const guardar = (u: string | null, s: string) => {
    try {
      if (u) localStorage.setItem(CLAVE_SESION, JSON.stringify({ usuarioId: u, sedeId: s }));
      else localStorage.removeItem(CLAVE_SESION);
    } catch {
      // almacenamiento no disponible
    }
  };

  const actualizar = useCallback(
    (cambio: (db: BaseDatos) => BaseDatos) => setDb((d) => (d ? cambio(d) : d)),
    []
  );

  const usuario = useMemo(
    () => db?.usuarios.find((u) => u.id === usuarioId) ?? null,
    [db, usuarioId]
  );

  const valor = useMemo<Contexto | null>(() => {
    if (!db) return null;
    return {
      db,
      actualizar,
      usuario,
      hoy,
      sedeId,
      iniciarSesion: (id) => {
        const u = db.usuarios.find((x) => x.id === id);
        if (!u) return;
        setUsuarioId(id);
        setSedeId(u.sedeId);
        guardar(id, u.sedeId);
      },
      cerrarSesion: () => {
        setUsuarioId(null);
        guardar(null, sedeId);
      },
      cambiarSede: (s) => {
        setSedeId(s);
        guardar(usuarioId, s);
      },
    };
  }, [db, actualizar, usuario, hoy, sedeId, usuarioId]);

  if (!valor) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-slate-500">
        Cargando…
      </div>
    );
  }
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useDatos() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDatos debe usarse dentro de ProveedorDatos");
  return c;
}

// Atajos con los datos de la sede activa
export function useSede() {
  const { db, sedeId, usuario } = useDatos();
  return useMemo(() => {
    const sede = db.sedes.find((s) => s.id === sedeId)!;
    const deSede = <T extends { sedeId: string | null }>(lista: T[]) =>
      lista.filter((x) => x.sedeId === sedeId);
    // Ministerios que coordina el usuario (para el rol Coordinador)
    const misMinisterios = db.ministerios.filter(
      (m) => usuario?.miembroId && m.coordinadorId === usuario.miembroId
    );
    return {
      sede,
      miembros: deSede(db.miembros),
      eventos: deSede(db.eventos),
      ministerios: deSede(db.ministerios),
      aportaciones: deSede(db.aportaciones),
      anuncios: db.anuncios.filter((a) => a.sedeId === null || a.sedeId === sedeId),
      horarios: deSede(db.horarios),
      misMinisterios,
    };
  }, [db, sedeId, usuario]);
}

export const nuevoId = (prefijo: string) =>
  `${prefijo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
