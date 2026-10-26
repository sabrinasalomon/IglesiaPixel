"use client";

import { Building2, Mail, MapPin, Phone, Plus } from "lucide-react";
import { useState } from "react";
import { Boton, Campo, Encabezado, Entrada, Etiqueta, Modal, SinAcceso, Tarjeta } from "@/components/ui";
import { acceso } from "@/lib/permisos";
import { nuevoId, useDatos } from "@/lib/store";
import type { Sede } from "@/lib/types";

type Form = Omit<Sede, "id" | "activa">;

export default function Sedes() {
  const { db, usuario, actualizar, cambiarSede } = useDatos();
  const [form, setForm] = useState<Form | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  if (!acceso(usuario!.rol, "sedes")) return <SinAcceso />;

  const guardar = () => {
    if (!form?.nombre.trim()) return;
    actualizar((d) => ({
      ...d,
      sedes: editandoId
        ? d.sedes.map((s) => (s.id === editandoId ? { ...s, ...form } : s))
        : [...d.sedes, { id: nuevoId("s"), activa: true, ...form }],
    }));
    setForm(null);
  };

  return (
    <>
      <Encabezado
        titulo="Sedes"
        descripcion="Cada sede tiene sus propios miembros, eventos, ministerios y finanzas"
        acciones={<Boton onClick={() => { setEditandoId(null); setForm({ nombre: "", direccion: "", telefono: "", correo: "" }); }}><Plus size={16} /> Nueva sede</Boton>}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {db.sedes.map((s) => (
          <Tarjeta key={s.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Building2 size={18} /></span>
                <h2 className="font-semibold">{s.nombre}</h2>
              </div>
              {s.activa ? <Etiqueta tono="verde">Activa</Etiqueta> : <Etiqueta>Inactiva</Etiqueta>}
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li className="flex gap-2"><MapPin size={15} className="mt-0.5 shrink-0" /> {s.direccion}</li>
              <li className="flex gap-2"><Phone size={15} className="mt-0.5" /> {s.telefono}</li>
              <li className="flex gap-2"><Mail size={15} className="mt-0.5" /> {s.correo}</li>
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              {db.miembros.filter((m) => m.sedeId === s.id && m.activo).length} miembros activos ·{" "}
              {db.ministerios.filter((m) => m.sedeId === s.id).length} ministerios
            </p>
            <div className="mt-4 flex gap-2">
              <Boton variante="secundario" onClick={() => cambiarSede(s.id)}>Trabajar en esta sede</Boton>
              <Boton variante="fantasma" onClick={() => { setEditandoId(s.id); setForm({ nombre: s.nombre, direccion: s.direccion, telefono: s.telefono, correo: s.correo }); }}>Editar</Boton>
            </div>
          </Tarjeta>
        ))}
      </div>

      <Modal
        titulo={editandoId ? "Editar sede" : "Nueva sede"}
        abierto={!!form}
        alCerrar={() => setForm(null)}
        pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton onClick={guardar}>Guardar</Boton></>}
      >
        {form && (
          <>
            <Campo etiqueta="Nombre"><Entrada value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Campo>
            <Campo etiqueta="Dirección"><Entrada value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Teléfono"><Entrada value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></Campo>
              <Campo etiqueta="Correo"><Entrada type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} /></Campo>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
