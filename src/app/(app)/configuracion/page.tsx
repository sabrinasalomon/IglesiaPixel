"use client";

import { Church, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { Boton, Campo, Encabezado, Entrada, Selector, SinAcceso, Tarjeta } from "@/components/ui";
import { acceso } from "@/lib/permisos";
import { nuevoId, useDatos, useSede } from "@/lib/store";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function Configuracion() {
  const { db, usuario, actualizar, sedeId } = useDatos();
  const { sede, horarios } = useSede();
  const [general, setGeneral] = useState(db.configuracion);
  const [datosSede, setDatosSede] = useState(sede);
  const [nuevo, setNuevo] = useState({ dia: "Domingo", hora: "18:00", tipo: "" });
  const [guardado, setGuardado] = useState(false);
  if (datosSede.id !== sede.id) setDatosSede(sede);

  const permiso = acceso(usuario!.rol, "configuracion");
  if (!permiso) return <SinAcceso />;
  const soloLectura = permiso !== "total";

  const guardar = () => {
    actualizar((d) => ({
      ...d,
      configuracion: general,
      sedes: d.sedes.map((s) => (s.id === datosSede.id ? datosSede : s)),
    }));
    setGuardado(true);
  };

  const agregarHorario = () => {
    if (!nuevo.tipo.trim()) return;
    actualizar((d) => ({ ...d, horarios: [...d.horarios, { id: nuevoId("h"), sedeId, ...nuevo }] }));
    setNuevo({ ...nuevo, tipo: "" });
  };

  return (
    <>
      <Encabezado
        titulo="Configuración"
        descripcion="Información institucional y de la sede activa"
        acciones={!soloLectura && <Boton onClick={guardar}>Guardar cambios</Boton>}
      />
      {guardado && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Cambios guardados.</p>}
      <fieldset disabled={soloLectura} className="grid gap-4 lg:grid-cols-2">
        <Tarjeta className="space-y-4 p-5">
          <h2 className="font-semibold">Iglesia</h2>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-600 text-white"><Church size={30} /></div>
            <Boton variante="secundario" type="button"><Upload size={16} /> Cambiar logotipo</Boton>
          </div>
          <Campo etiqueta="Nombre de la iglesia"><Entrada value={general.nombre} onChange={(e) => setGeneral({ ...general, nombre: e.target.value })} /></Campo>
          <Campo etiqueta="Lema"><Entrada value={general.lema} onChange={(e) => setGeneral({ ...general, lema: e.target.value })} /></Campo>
        </Tarjeta>

        <Tarjeta className="space-y-4 p-5">
          <h2 className="font-semibold">Datos de contacto · {sede.nombre}</h2>
          <Campo etiqueta="Dirección"><Entrada value={datosSede.direccion} onChange={(e) => setDatosSede({ ...datosSede, direccion: e.target.value })} /></Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Teléfono"><Entrada value={datosSede.telefono} onChange={(e) => setDatosSede({ ...datosSede, telefono: e.target.value })} /></Campo>
            <Campo etiqueta="Correo"><Entrada value={datosSede.correo} onChange={(e) => setDatosSede({ ...datosSede, correo: e.target.value })} /></Campo>
          </div>
        </Tarjeta>

        <Tarjeta className="p-5 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Horarios habituales de reunión · {sede.nombre}</h2>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {horarios.map((h) => (
              <li key={h.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span><strong>{h.dia}</strong> · {h.hora} · {h.tipo}</span>
                {!soloLectura && (
                  <button type="button" aria-label="Quitar horario" className="text-slate-400 hover:text-red-600"
                    onClick={() => actualizar((d) => ({ ...d, horarios: d.horarios.filter((x) => x.id !== h.id) }))}>
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {!soloLectura && (
            <div className="mt-3 grid gap-2 sm:grid-cols-[140px_120px_1fr_auto]">
              <Selector value={nuevo.dia} onChange={(e) => setNuevo({ ...nuevo, dia: e.target.value })}>
                {DIAS.map((d) => <option key={d}>{d}</option>)}
              </Selector>
              <Entrada type="time" value={nuevo.hora} onChange={(e) => setNuevo({ ...nuevo, hora: e.target.value })} />
              <Entrada placeholder="Tipo de reunión" value={nuevo.tipo} onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })} />
              <Boton type="button" onClick={agregarHorario}><Plus size={16} /> Agregar</Boton>
            </div>
          )}
        </Tarjeta>
      </fieldset>
    </>
  );
}
