"use client";

import { CalendarDays, Clock, MapPin } from "lucide-react";
import { useCallback } from "react";
import { Encabezado, Etiqueta, Tarjeta } from "@/components/ui";
import { fechaLarga } from "@/lib/formato";
import { useDatos } from "@/lib/store";
import type { Anuncio, Evento, Horario } from "@/lib/types";
import { useCarga } from "@/lib/usar-carga";

// Portal del rol Miembro: solo lectura de anuncios y eventos de su sede
export default function Inicio() {
  const { usuario, repo, db, sedeId, hoy } = useDatos();
  const sede = db.sedes.find((s) => s.id === sedeId);
  const cargar = useCallback(async () => {
    const [anuncios, eventos, horarios] = await Promise.all([
      repo.anuncios.listar(sedeId),
      repo.eventos.listar(sedeId),
      repo.horarios.listar(sedeId),
    ]);
    return { anuncios, eventos, horarios };
  }, [repo, sedeId]);
  const { datos, error } = useCarga<{ anuncios: Anuncio[]; eventos: Evento[]; horarios: Horario[] }>(cargar, {
    anuncios: [],
    eventos: [],
    horarios: [],
  });
  const { anuncios, eventos, horarios } = datos;

  const avisos = anuncios
    .filter((a) => a.fechaPublicacion <= hoy)
    .sort((a, b) => Number(b.importante) - Number(a.importante) || b.fechaPublicacion.localeCompare(a.fechaPublicacion));
  const proximos = eventos
    .filter((e) => e.fecha >= hoy && !e.cancelado)
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
    .slice(0, 8);

  return (
    <>
      <Encabezado titulo={`Bienvenido, ${usuario!.nombre.split(" ")[0]}`} descripcion={`${sede?.nombre ?? ""} · ${sede?.direccion ?? ""}`} />
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="font-semibold">Anuncios</h2>
          {avisos.length === 0 && <p className="text-sm text-slate-500">No hay anuncios por ahora.</p>}
          {avisos.map((a) => (
            <Tarjeta key={a.id} className={`p-5 ${a.importante ? "border-amber-200" : ""}`}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{a.titulo}</h3>
                {a.importante && <Etiqueta tono="ambar">Importante</Etiqueta>}
              </div>
              <p className="mt-1 text-xs text-slate-500">{fechaLarga(a.fechaPublicacion)}</p>
              <p className="mt-2 text-sm text-slate-700">{a.contenido}</p>
            </Tarjeta>
          ))}
        </div>
        <div className="space-y-4">
          <Tarjeta className="p-5">
            <h2 className="mb-3 font-semibold">Próximos eventos</h2>
            <ul className="space-y-3">
              {proximos.length === 0 && <li className="text-sm text-slate-500">No hay eventos programados.</li>}
              {proximos.map((e) => (
                <li key={e.id} className="text-sm">
                  <p className="font-medium">{e.titulo}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500"><CalendarDays size={12} /> {fechaLarga(e.fecha)}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500"><Clock size={12} /> {e.hora} <MapPin size={12} className="ml-2" /> {e.lugar}</p>
                </li>
              ))}
            </ul>
          </Tarjeta>
          <Tarjeta className="p-5">
            <h2 className="mb-3 font-semibold">Horarios de reunión</h2>
            <ul className="space-y-1 text-sm">
              {horarios.map((h) => (
                <li key={h.id} className="flex justify-between"><span>{h.dia} · {h.tipo}</span><span className="text-slate-500">{h.hora}</span></li>
              ))}
            </ul>
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
