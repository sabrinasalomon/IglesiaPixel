"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { AreaTexto, Boton, Campo, Encabezado, Entrada, Etiqueta, Modal, Selector, SinAcceso, Tarjeta } from "@/components/ui";
import { TIPOS_EVENTO } from "@/lib/catalogos";
import { iso } from "@/lib/datos-ejemplo";
import { aFecha, fechaLarga, MESES } from "@/lib/formato";
import { acceso } from "@/lib/permisos";
import { nuevoId, useDatos, useSede } from "@/lib/store";
import type { Evento, TipoEvento } from "@/lib/types";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type Form = Omit<Evento, "id" | "sedeId" | "cancelado">;

export default function Eventos() {
  const { usuario, actualizar, sedeId, hoy } = useDatos();
  const { eventos, miembros, ministerios, misMinisterios } = useSede();
  const [mes, setMes] = useState(() => hoy.slice(0, 7));
  const [seleccionado, setSeleccionado] = useState<Evento | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const permiso = acceso(usuario!.rol, "eventos");
  const idsMios = new Set(misMinisterios.map((m) => m.id));
  const puedeEditar = (e?: Evento) =>
    permiso === "total" || (permiso === "ministerio" && (!e || (!!e.ministerioId && idsMios.has(e.ministerioId))));

  const dias = useMemo(() => {
    const [a, m] = mes.split("-").map(Number);
    const primero = new Date(a, m - 1, 1);
    const inicio = new Date(primero);
    inicio.setDate(1 - primero.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      return { fecha: iso(d), delMes: d.getMonth() === m - 1, dia: d.getDate() };
    });
  }, [mes]);

  if (!permiso) return <SinAcceso />;

  const moverMes = (delta: number) => {
    const d = aFecha(`${mes}-01`);
    d.setMonth(d.getMonth() + delta);
    setMes(iso(d).slice(0, 7));
  };

  const abrirNuevo = (fecha = hoy) => {
    setEditandoId(null);
    setForm({
      titulo: "",
      tipo: permiso === "ministerio" ? "Reunión de ministerio" : "Culto dominical",
      fecha,
      hora: "10:00",
      lugar: "Templo principal",
      descripcion: "",
      responsables: [],
      ministerioId: permiso === "ministerio" ? misMinisterios[0]?.id : undefined,
    });
  };

  const abrirEdicion = (e: Evento) => {
    setSeleccionado(null);
    setEditandoId(e.id);
    setForm({ titulo: e.titulo, tipo: e.tipo, fecha: e.fecha, hora: e.hora, lugar: e.lugar, descripcion: e.descripcion, responsables: e.responsables, ministerioId: e.ministerioId });
  };

  const guardar = () => {
    if (!form || !form.titulo.trim()) return;
    actualizar((db) => ({
      ...db,
      eventos: editandoId
        ? db.eventos.map((e) => (e.id === editandoId ? { ...e, ...form } : e))
        : [...db.eventos, { id: nuevoId("e"), sedeId, cancelado: false, ...form }],
    }));
    setForm(null);
  };

  const alternarCancelado = (e: Evento) => {
    actualizar((db) => ({ ...db, eventos: db.eventos.map((x) => (x.id === e.id ? { ...x, cancelado: !x.cancelado } : x)) }));
    setSeleccionado({ ...e, cancelado: !e.cancelado });
  };

  const nombreMiembro = (id: string) => miembros.find((m) => m.id === id)?.nombre ?? "—";
  const [a, m] = mes.split("-").map(Number);
  const ministeriosElegibles = permiso === "ministerio" ? misMinisterios : ministerios;

  return (
    <>
      <Encabezado
        titulo="Eventos"
        descripcion="Cultos, reuniones y actividades de la sede"
        acciones={puedeEditar() && <Boton onClick={() => abrirNuevo()}><Plus size={16} /> Nuevo evento</Boton>}
      />
      <Tarjeta>
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold capitalize">{MESES[m - 1]} {a}</h2>
          <div className="flex gap-1">
            <Boton variante="secundario" onClick={() => moverMes(-1)} aria-label="Mes anterior"><ChevronLeft size={16} /></Boton>
            <Boton variante="secundario" onClick={() => setMes(hoy.slice(0, 7))}>Hoy</Boton>
            <Boton variante="secundario" onClick={() => moverMes(1)} aria-label="Mes siguiente"><ChevronRight size={16} /></Boton>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-500">
          {DIAS.map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {dias.map((d) => {
            const delDia = eventos.filter((e) => e.fecha === d.fecha).sort((x, y) => x.hora.localeCompare(y.hora));
            return (
              <div
                key={d.fecha}
                className={`min-h-24 border-b border-r border-slate-100 p-1.5 ${d.delMes ? "" : "bg-slate-50/60 text-slate-400"}`}
                onDoubleClick={() => puedeEditar() && abrirNuevo(d.fecha)}
              >
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${d.fecha === hoy ? "bg-indigo-600 font-semibold text-white" : ""}`}>
                  {d.dia}
                </span>
                <div className="mt-1 space-y-1">
                  {delDia.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setSeleccionado(e)}
                      className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] ${
                        e.cancelado ? "bg-slate-100 text-slate-400 line-through" : e.ministerioId ? "bg-emerald-50 text-emerald-800" : "bg-indigo-50 text-indigo-800"
                      }`}
                    >
                      {e.hora} {e.titulo}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Tarjeta>

      <Modal
        titulo={seleccionado?.titulo ?? ""}
        abierto={!!seleccionado}
        alCerrar={() => setSeleccionado(null)}
        pie={
          seleccionado && puedeEditar(seleccionado) && (
            <>
              <Boton variante={seleccionado.cancelado ? "secundario" : "peligro"} onClick={() => alternarCancelado(seleccionado)}>
                {seleccionado.cancelado ? "Reactivar evento" : "Cancelar evento"}
              </Boton>
              <Boton onClick={() => abrirEdicion(seleccionado)}>Editar</Boton>
            </>
          )
        }
      >
        {seleccionado && (
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <Etiqueta tono="indigo">{seleccionado.tipo}</Etiqueta>
              {seleccionado.cancelado && <Etiqueta tono="rojo">Cancelado</Etiqueta>}
            </div>
            <p ><strong>Fecha:</strong> {fechaLarga(seleccionado.fecha)}, {seleccionado.hora}</p>
            <p><strong>Lugar:</strong> {seleccionado.lugar}</p>
            {seleccionado.ministerioId && <p><strong>Ministerio:</strong> {ministerios.find((x) => x.id === seleccionado.ministerioId)?.nombre}</p>}
            <p><strong>Responsables:</strong> {seleccionado.responsables.map(nombreMiembro).join(", ") || "Sin asignar"}</p>
            <p className="text-slate-600">{seleccionado.descripcion}</p>
          </div>
        )}
      </Modal>

      <Modal
        titulo={editandoId ? "Editar evento" : "Nuevo evento"}
        abierto={!!form}
        alCerrar={() => setForm(null)}
        pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton onClick={guardar}>Guardar</Boton></>}
      >
        {form && (
          <>
            <Campo etiqueta="Título"><Entrada value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Tipo">
                <Selector value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoEvento })}>
                  {TIPOS_EVENTO.map((t) => <option key={t}>{t}</option>)}
                </Selector>
              </Campo>
              <Campo etiqueta="Ministerio (opcional)">
                <Selector value={form.ministerioId ?? ""} onChange={(e) => setForm({ ...form, ministerioId: e.target.value || undefined })}>
                  {permiso !== "ministerio" && <option value="">Ninguno</option>}
                  {ministeriosElegibles.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                </Selector>
              </Campo>
              <Campo etiqueta="Fecha"><Entrada type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Campo>
              <Campo etiqueta="Hora"><Entrada type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></Campo>
            </div>
            <Campo etiqueta="Lugar"><Entrada value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} /></Campo>
            <Campo etiqueta="Responsables (Ctrl o Cmd para elegir varios)">
              <Selector
                multiple
                className="h-32"
                value={form.responsables}
                onChange={(e) => setForm({ ...form, responsables: [...e.target.selectedOptions].map((o) => o.value) })}
              >
                {miembros.filter((x) => x.activo).map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
              </Selector>
            </Campo>
            <Campo etiqueta="Descripción"><AreaTexto value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></Campo>
          </>
        )}
      </Modal>
    </>
  );
}
