"use client";

import { Pencil, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Boton, Campo, Encabezado, Entrada, Etiqueta, Modal, Selector, SinAcceso, Tabla, Tarjeta, td, th, Vacio } from "@/components/ui";
import { fechaCorta } from "@/lib/formato";
import { acceso } from "@/lib/permisos";
import { nuevoId, useDatos, useSede } from "@/lib/store";
import type { Miembro } from "@/lib/types";

type Filtro = "todos" | "activos" | "inactivos";
const vacio = { nombre: "", telefono: "", correo: "", fechaIngreso: "" };

export default function Miembros() {
  const { usuario, actualizar, sedeId, hoy } = useDatos();
  const { miembros, sede } = useSede();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("activos");
  const [editando, setEditando] = useState<Miembro | "nuevo" | null>(null);
  const [form, setForm] = useState(vacio);

  const permiso = acceso(usuario!.rol, "miembros");
  const puedeEditar = permiso === "total";

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return miembros
      .filter((m) => (filtro === "todos" ? true : filtro === "activos" ? m.activo : !m.activo))
      .filter((m) => !q || m.nombre.toLowerCase().includes(q))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [miembros, busqueda, filtro]);

  if (!permiso || permiso === "perfil") return <SinAcceso />;

  const abrir = (m: Miembro | "nuevo") => {
    setEditando(m);
    setForm(m === "nuevo" ? { ...vacio, fechaIngreso: hoy } : { nombre: m.nombre, telefono: m.telefono, correo: m.correo, fechaIngreso: m.fechaIngreso });
  };

  const guardar = () => {
    if (!form.nombre.trim()) return;
    actualizar((db) => ({
      ...db,
      miembros:
        editando === "nuevo"
          ? [...db.miembros, { id: nuevoId("m"), sedeId, activo: true, ...form }]
          : db.miembros.map((m) => (m.id === (editando as Miembro).id ? { ...m, ...form } : m)),
    }));
    setEditando(null);
  };

  // Baja lógica: el registro se conserva y puede reactivarse
  const alternarEstado = (id: string) =>
    actualizar((db) => ({
      ...db,
      miembros: db.miembros.map((m) => (m.id === id ? { ...m, activo: !m.activo } : m)),
    }));

  return (
    <>
      <Encabezado
        titulo="Miembros"
        descripcion={`${miembros.filter((m) => m.activo).length} activos en ${sede.nombre}`}
        acciones={puedeEditar && <Boton onClick={() => abrir("nuevo")}><Plus size={16} /> Nuevo miembro</Boton>}
      />
      <Tarjeta>
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
          <div className="relative min-w-60 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Entrada className="pl-9" placeholder="Buscar por nombre" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <Selector className="w-40" value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
            <option value="todos">Todos</option>
          </Selector>
        </div>
        <Tabla>
          <thead>
            <tr>
              <th className={th}>Nombre</th>
              <th className={th}>Teléfono</th>
              <th className={th}>Correo</th>
              <th className={th}>Ingreso</th>
              <th className={th}>Estado</th>
              {puedeEditar && <th className={th}></th>}
            </tr>
          </thead>
          <tbody>
            {lista.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className={`${td} font-medium text-slate-900`}>{m.nombre}</td>
                <td className={`${td} whitespace-nowrap`}>{m.telefono}</td>
                <td className={td}>{m.correo}</td>
                <td className={td}>{fechaCorta(m.fechaIngreso)}</td>
                <td className={td}>{m.activo ? <Etiqueta tono="verde">Activo</Etiqueta> : <Etiqueta>Inactivo</Etiqueta>}</td>
                {puedeEditar && (
                  <td className={`${td} whitespace-nowrap text-right`}>
                    <Boton variante="fantasma" onClick={() => abrir(m)} aria-label="Editar"><Pencil size={15} /></Boton>
                    <Boton variante={m.activo ? "peligro" : "secundario"} className="ml-1 py-1" onClick={() => alternarEstado(m.id)}>
                      {m.activo ? "Desactivar" : "Reactivar"}
                    </Boton>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Tabla>
        {lista.length === 0 && <Vacio>No hay miembros que coincidan con la búsqueda.</Vacio>}
      </Tarjeta>

      <Modal
        titulo={editando === "nuevo" ? "Nuevo miembro" : "Editar miembro"}
        abierto={!!editando}
        alCerrar={() => setEditando(null)}
        pie={<><Boton variante="secundario" onClick={() => setEditando(null)}>Cancelar</Boton><Boton onClick={guardar}>Guardar</Boton></>}
      >
        <Campo etiqueta="Nombre completo"><Entrada value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Teléfono"><Entrada value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></Campo>
          <Campo etiqueta="Fecha de ingreso"><Entrada type="date" value={form.fechaIngreso} onChange={(e) => setForm({ ...form, fechaIngreso: e.target.value })} /></Campo>
        </div>
        <Campo etiqueta="Correo electrónico"><Entrada type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} /></Campo>
      </Modal>
    </>
  );
}
