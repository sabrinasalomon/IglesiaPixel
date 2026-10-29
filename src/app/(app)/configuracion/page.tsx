"use client";

import { Plus, Trash2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { Boton, Campo, Dibujo, Encabezado, Entrada, Selector, SinAcceso, Tarjeta, elevar } from "@/components/ui";
import { acceso } from "@/lib/permisos";
import type { DatosSede } from "@/lib/repositorio/tipos";
import { useDatos } from "@/lib/store";
import type { Horario } from "@/lib/types";
import { intentar, useCarga } from "@/lib/usar-carga";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function Configuracion() {
  const { db, usuario, repo, recargar, sedeId } = useDatos();
  const sede = db.sedes.find((s) => s.id === sedeId)!;
  const cargarHorarios = useCallback(() => repo.horarios.listar(sedeId), [repo, sedeId]);
  const { datos: horarios, recargar: recargarHorarios } = useCarga<Horario[]>(cargarHorarios, []);

  const [general, setGeneral] = useState(db.configuracion);
  const [contacto, setContacto] = useState<DatosSede & { id: string }>(sede);
  const [nuevo, setNuevo] = useState({ dia: "Domingo", hora: "18:00", tipo: "" });
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);
  if (contacto.id !== sede.id) setContacto(sede);

  const permiso = acceso(usuario!.rol, "configuracion");
  if (!permiso) return <SinAcceso />;
  const soloLectura = permiso !== "total";

  const avisar = (fallo: string, exito: string) => setMensaje(fallo ? { ok: false, texto: fallo } : { ok: true, texto: exito });

  const guardar = async () => {
    const { id, ...datosSede } = contacto;
    const fallo = await intentar(async () => {
      await repo.configuracion.guardar(general);
      await repo.sedes.editar(id, { ...datosSede, nombre: sede.nombre });
      await recargar();
    });
    avisar(fallo, "Cambios guardados.");
  };

  const subirLogo = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return avisar("El logotipo debe ser una imagen (PNG, JPG o SVG).", "");
    if (f.size > 2 * 1024 * 1024) return avisar("La imagen debe pesar menos de 2 MB.", "");
    setSubiendo(true);
    const fallo = await intentar(async () => {
      const logoUrl = await repo.configuracion.subirLogo(f);
      const nueva = { ...general, logoUrl };
      await repo.configuracion.guardar(nueva);
      setGeneral(nueva);
      await recargar();
    });
    setSubiendo(false);
    avisar(fallo, "Logotipo actualizado.");
  };

  const agregarHorario = async () => {
    if (!nuevo.tipo.trim()) return;
    const fallo = await intentar(() => repo.horarios.crear(sedeId, nuevo));
    if (fallo) return avisar(fallo, "");
    setNuevo({ ...nuevo, tipo: "" });
    recargarHorarios();
  };

  const quitarHorario = async (id: string) => {
    const fallo = await intentar(() => repo.horarios.eliminar(id));
    if (fallo) return avisar(fallo, "");
    recargarHorarios();
  };

  return (
    <>
      <Encabezado
        titulo="Configuración"
        descripcion="Información institucional y de la sede activa"
        acciones={!soloLectura && <Boton onClick={guardar}>Guardar cambios</Boton>}
        dibujo={<Dibujo nombre="vitral" />}
        fondo="/pixel/fondo-configuracion.jpg"
      />
      {mensaje && (
        <p className={`mb-4 px-3 py-2 text-sm ${mensaje.ok ? "bg-olivo-50 text-olivo-700" : "bg-liston-50 text-liston-700"}`}>{mensaje.texto}</p>
      )}
      <fieldset disabled={soloLectura} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Tarjeta className="space-y-4 p-5">
          <h2 className="font-titulo text-xl font-semibold">Iglesia</h2>
          <div className="flex items-center gap-4">
            <Logo url={general.logoUrl} tamano={64} />
            <input ref={archivo} type="file" accept="image/*" className="hidden" onChange={(e) => subirLogo(e.target.files?.[0])} />
            {!soloLectura && (
              <Boton variante="secundario" type="button" disabled={subiendo} onClick={() => archivo.current?.click()}>
                <Upload size={16} /> {subiendo ? "Subiendo…" : "Cambiar logotipo"}
              </Boton>
            )}
          </div>
          <Campo etiqueta="Nombre de la iglesia"><Entrada value={general.nombre} onChange={(e) => setGeneral({ ...general, nombre: e.target.value })} /></Campo>
          <Campo etiqueta="Lema"><Entrada value={general.lema} onChange={(e) => setGeneral({ ...general, lema: e.target.value })} /></Campo>
        </Tarjeta>

        <Tarjeta className="space-y-4 p-5">
          <h2 className="font-titulo text-xl font-semibold">Datos de contacto · {sede.nombre}</h2>
          <Campo etiqueta="Dirección"><Entrada value={contacto.direccion} onChange={(e) => setContacto({ ...contacto, direccion: e.target.value })} /></Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Teléfono"><Entrada value={contacto.telefono} onChange={(e) => setContacto({ ...contacto, telefono: e.target.value })} /></Campo>
            <Campo etiqueta="Correo"><Entrada value={contacto.correo} onChange={(e) => setContacto({ ...contacto, correo: e.target.value })} /></Campo>
          </div>
        </Tarjeta>

        <Tarjeta className="p-5 lg:col-span-2">
          <h2 className="mb-3 font-titulo text-xl font-semibold">Horarios habituales de reunión · {sede.nombre}</h2>
          {/* Cada horario como una ficha con el día en un cuadrito, ordenados de lunes a domingo */}
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[...horarios]
              .sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || a.hora.localeCompare(b.hora))
              .map((h) => (
                <li key={h.id} className={`flex items-center gap-3 border border-piedra-300 bg-white p-2 text-sm ${elevar}`}>
                  <span className="flex w-14 shrink-0 flex-col items-center border-2 border-piedra-900 bg-marca-900 py-1 text-white">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-dorado-300">{h.dia.slice(0, 3)}</span>
                    <span className="font-titulo text-base font-semibold leading-tight">{h.hora}</span>
                  </span>
                  <span className="flex-1 font-medium text-piedra-900">{h.tipo}</span>
                  {!soloLectura && (
                    <button type="button" aria-label="Quitar horario" className="p-1.5 text-piedra-400 transition-colors hover:bg-liston-50 hover:text-liston-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-liston-300" title="Quitar horario" onClick={() => quitarHorario(h.id)}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </li>
              ))}
            {horarios.length === 0 && <li className="text-sm text-piedra-500">Sin horarios registrados.</li>}
          </ul>
          {!soloLectura && (
            // En pantallas chicas: día y hora en una fila, tipo y botón en otra
            <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-piedra-200 pt-4">
              <Selector aria-label="Día" className="h-10 w-[calc(50%-6px)]! md:w-40!" value={nuevo.dia} onChange={(e) => setNuevo({ ...nuevo, dia: e.target.value })}>
                {DIAS.map((d) => <option key={d}>{d}</option>)}
              </Selector>
              <Entrada aria-label="Hora" className="h-10 w-[calc(50%-6px)]! md:w-36!" type="time" value={nuevo.hora} onChange={(e) => setNuevo({ ...nuevo, hora: e.target.value })} />
              <Entrada aria-label="Tipo de reunión" className="h-10 min-w-0 flex-1 basis-40" placeholder="Tipo de reunión" value={nuevo.tipo} onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })} />
              <Boton type="button" className="h-10 shrink-0" onClick={agregarHorario}><Plus size={16} /> Agregar</Boton>
            </div>
          )}
        </Tarjeta>
      </fieldset>
    </>
  );
}
