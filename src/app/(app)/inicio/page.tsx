"use client";

import { useCallback } from "react";
import { Semana } from "@/components/semana";
import { Dibujo, Encabezado, Etiqueta, Liston, Tarjeta } from "@/components/ui";
import { aFecha, fechaLarga, MESES } from "@/lib/formato";
import { useDatos } from "@/lib/store";
import type { Anuncio, Evento, Horario } from "@/lib/types";
import { useCarga } from "@/lib/usar-carga";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

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

  return (
    <>
      <Encabezado titulo={`Bienvenido, ${usuario!.nombre.split(" ")[0]}`} descripcion={sede ? `${sede.nombre}, ${sede.direccion}` : undefined} dibujo={<Dibujo nombre="bancas" />} />
      {error && <p className="mb-4 bg-liston-50 px-3 py-2 text-sm text-liston-700">{error}</p>}

      <Semana eventos={eventos} hoy={hoy} />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <h2 className="font-titulo text-xl font-semibold">Anuncios</h2>
          {avisos.length === 0 && <p className="text-sm text-piedra-500">No hay anuncios por ahora.</p>}
          {/* Mismo tablón que en Comunicados: hojas clavadas con una tachuela */}
          {avisos.map((a) => {
            const fecha = aFecha(a.fechaPublicacion);
            return (
              <Tarjeta key={a.id} className={`relative flex gap-4 p-5 pt-6 ${a.importante ? "border-liston-700!" : ""}`}>
                <span aria-hidden className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 border-2 border-piedra-900 bg-liston-600" />
                {a.importante && <Liston className="left-1.5 h-10" />}
                <div className="flex w-14 shrink-0 flex-col items-center self-start border border-piedra-900 bg-piedra-100 text-center">
                  <span className="w-full bg-marca-900 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">{MESES[fecha.getMonth()].slice(0, 3)}</span>
                  <span className="py-1 font-titulo text-2xl font-semibold text-piedra-900">{fecha.getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-titulo text-lg font-semibold leading-snug text-piedra-900">{a.titulo}</h3>
                  {a.importante && <div className="mt-1"><Etiqueta tono="liston">Importante</Etiqueta></div>}
                  <p className="mt-2 text-sm leading-relaxed text-piedra-700">{a.contenido}</p>
                  <p className="mt-3 text-xs text-piedra-500">{fechaLarga(a.fechaPublicacion)}</p>
                </div>
              </Tarjeta>
            );
          })}
        </section>
        <section>
          <h2 className="mb-3 font-titulo text-xl font-semibold">Horarios de reunión</h2>
          {/* Fichas con el día y la hora, como en Configuración */}
          <ul className="space-y-3">
            {horarios.length === 0 && <li className="text-sm text-piedra-500">La sede aún no registra horarios.</li>}
            {[...horarios]
              .sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || a.hora.localeCompare(b.hora))
              .map((h) => (
                <li key={h.id} className="pixel-suave flex items-center gap-3 bg-piedra-50 p-2">
                  <span className="flex w-14 shrink-0 flex-col items-center border border-piedra-900 bg-marca-900 py-1 text-white">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-dorado-300">{h.dia.slice(0, 3)}</span>
                    <span className="font-titulo text-base font-semibold leading-tight">{h.hora}</span>
                  </span>
                  <span className="font-medium text-piedra-900">{h.tipo}</span>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </>
  );
}
