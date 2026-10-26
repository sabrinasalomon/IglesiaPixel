"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AreaTexto, Boton, Campo, Encabezado, Entrada, Etiqueta, Modal, Selector, SinAcceso, Tarjeta } from "@/components/ui";
import { fechaLarga } from "@/lib/formato";
import { acceso } from "@/lib/permisos";
import { nuevoId, useDatos, useSede } from "@/lib/store";
import type { Anuncio } from "@/lib/types";

type Form = Pick<Anuncio, "titulo" | "contenido" | "fechaPublicacion" | "importante" | "sedeId">;

export default function Comunicados() {
  const { db, usuario, actualizar, sedeId, hoy } = useDatos();
  const { anuncios } = useSede();
  const [form, setForm] = useState<Form | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const permiso = acceso(usuario!.rol, "comunicados");
  if (!permiso) return <SinAcceso />;
  const puedeEditar = permiso === "total";

  const lista = [...anuncios].sort((a, b) => b.fechaPublicacion.localeCompare(a.fechaPublicacion));
  const autor = (id: string) => db.usuarios.find((u) => u.id === id)?.nombre ?? "—";

  const guardar = () => {
    if (!form?.titulo.trim()) return;
    actualizar((d) => ({
      ...d,
      anuncios: editandoId
        ? d.anuncios.map((a) => (a.id === editandoId ? { ...a, ...form } : a))
        : [{ id: nuevoId("an"), autorId: usuario!.id, ...form }, ...d.anuncios],
    }));
    setForm(null);
  };

  const eliminar = (id: string) => actualizar((d) => ({ ...d, anuncios: d.anuncios.filter((a) => a.id !== id) }));

  return (
    <>
      <Encabezado
        titulo="Comunicados y anuncios"
        descripcion="Los miembros ven estos avisos al iniciar sesión"
        acciones={
          puedeEditar && (
            <Boton onClick={() => { setEditandoId(null); setForm({ titulo: "", contenido: "", fechaPublicacion: hoy, importante: false, sedeId }); }}>
              <Plus size={16} /> Nuevo anuncio
            </Boton>
          )
        }
      />
      <div className="space-y-3">
        {lista.map((a) => (
          <Tarjeta key={a.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{a.titulo}</h2>
                  {a.importante && <Etiqueta tono="ambar">Importante</Etiqueta>}
                  {a.sedeId === null && <Etiqueta tono="indigo">Todas las sedes</Etiqueta>}
                  {a.fechaPublicacion > hoy && <Etiqueta>Programado</Etiqueta>}
                </div>
                <p className="mt-1 text-xs text-slate-500">{fechaLarga(a.fechaPublicacion)} · {autor(a.autorId)}</p>
              </div>
              {puedeEditar && (
                <div className="flex gap-1">
                  <Boton variante="fantasma" aria-label="Editar" onClick={() => { setEditandoId(a.id); setForm({ titulo: a.titulo, contenido: a.contenido, fechaPublicacion: a.fechaPublicacion, importante: a.importante, sedeId: a.sedeId }); }}>
                    <Pencil size={15} />
                  </Boton>
                  <Boton variante="fantasma" aria-label="Eliminar" className="hover:text-red-600" onClick={() => eliminar(a.id)}>
                    <Trash2 size={15} />
                  </Boton>
                </div>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-700">{a.contenido}</p>
          </Tarjeta>
        ))}
      </div>

      <Modal
        titulo={editandoId ? "Editar anuncio" : "Nuevo anuncio"}
        abierto={!!form}
        alCerrar={() => setForm(null)}
        pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton onClick={guardar}>Publicar</Boton></>}
      >
        {form && (
          <>
            <Campo etiqueta="Título"><Entrada value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></Campo>
            <Campo etiqueta="Contenido"><AreaTexto value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })} /></Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Fecha de publicación">
                <Entrada type="date" value={form.fechaPublicacion} onChange={(e) => setForm({ ...form, fechaPublicacion: e.target.value })} />
              </Campo>
              <Campo etiqueta="Dirigido a">
                <Selector
                  disabled={usuario!.rol !== "administrador"}
                  value={form.sedeId ?? "todas"}
                  onChange={(e) => setForm({ ...form, sedeId: e.target.value === "todas" ? null : e.target.value })}
                >
                  {db.sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  <option value="todas">Todas las sedes</option>
                </Selector>
              </Campo>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.importante} onChange={(e) => setForm({ ...form, importante: e.target.checked })} />
              Marcar como aviso importante
            </label>
          </>
        )}
      </Modal>
    </>
  );
}
