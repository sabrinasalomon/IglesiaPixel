"use client";

import { Plus, UserMinus, UsersRound } from "lucide-react";
import { useState } from "react";
import { AreaTexto, Boton, Campo, Encabezado, Entrada, Etiqueta, Modal, Selector, SinAcceso, Tarjeta } from "@/components/ui";
import { fechaCorta } from "@/lib/formato";
import { acceso } from "@/lib/permisos";
import { nuevoId, useDatos, useSede } from "@/lib/store";
import type { Ministerio } from "@/lib/types";

export default function Ministerios() {
  const { usuario, actualizar, sedeId, hoy } = useDatos();
  const { ministerios, miembros, eventos, misMinisterios } = useSede();
  const [abiertoId, setAbiertoId] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState<{ nombre: string; descripcion: string; coordinadorId: string } | null>(null);
  const [agregar, setAgregar] = useState("");

  const permiso = acceso(usuario!.rol, "ministerios");
  if (!permiso) return <SinAcceso />;

  const puedeCrear = permiso === "total" || permiso === "editar";
  const puedeEditar = (m: Ministerio) => puedeCrear || (permiso === "ministerio" && misMinisterios.some((x) => x.id === m.id));
  const nombre = (id?: string) => miembros.find((m) => m.id === id)?.nombre ?? "Sin asignar";
  const abierto = ministerios.find((m) => m.id === abiertoId);

  const cambiar = (id: string, cambio: (m: Ministerio) => Ministerio) =>
    actualizar((db) => ({ ...db, ministerios: db.ministerios.map((m) => (m.id === id ? cambio(m) : m)) }));

  const crear = () => {
    if (!nuevo?.nombre.trim()) return;
    actualizar((db) => ({
      ...db,
      ministerios: [
        ...db.ministerios,
        {
          id: nuevoId("min"),
          sedeId,
          nombre: nuevo.nombre,
          descripcion: nuevo.descripcion,
          coordinadorId: nuevo.coordinadorId || undefined,
          integrantes: nuevo.coordinadorId ? [nuevo.coordinadorId] : [],
        },
      ],
    }));
    setNuevo(null);
  };

  return (
    <>
      <Encabezado
        titulo="Ministerios"
        descripcion="Grupos de trabajo, sus coordinadores e integrantes"
        acciones={puedeCrear && <Boton onClick={() => setNuevo({ nombre: "", descripcion: "", coordinadorId: "" })}><Plus size={16} /> Nuevo ministerio</Boton>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ministerios.map((m) => {
          const proximos = eventos.filter((e) => e.ministerioId === m.id && e.fecha >= hoy && !e.cancelado);
          const mio = misMinisterios.some((x) => x.id === m.id);
          return (
            <Tarjeta key={m.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><UsersRound size={18} /></span>
                  <h2 className="font-semibold">{m.nombre}</h2>
                </div>
                {mio && <Etiqueta tono="indigo">Tu ministerio</Etiqueta>}
              </div>
              <p className="mt-3 text-sm text-slate-600">{m.descripcion}</p>
              <dl className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Coordinador</dt><dd className="font-medium">{nombre(m.coordinadorId)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Integrantes</dt><dd className="font-medium">{m.integrantes.length}</dd></div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Próxima actividad</dt>
                  <dd className="font-medium">{proximos[0] ? fechaCorta(proximos[0].fecha) : "Ninguna"}</dd>
                </div>
              </dl>
              <Boton variante="secundario" className="mt-4" onClick={() => setAbiertoId(m.id)}>Ver integrantes</Boton>
            </Tarjeta>
          );
        })}
      </div>

      <Modal titulo={abierto?.nombre ?? ""} abierto={!!abierto} alCerrar={() => setAbiertoId(null)}>
        {abierto && (
          <>
            <Campo etiqueta="Coordinador">
              <Selector
                disabled={!puedeCrear}
                value={abierto.coordinadorId ?? ""}
                onChange={(e) => cambiar(abierto.id, (m) => ({ ...m, coordinadorId: e.target.value || undefined }))}
              >
                <option value="">Sin asignar</option>
                {miembros.filter((x) => abierto.integrantes.includes(x.id)).map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
              </Selector>
            </Campo>
            {puedeEditar(abierto) && (
              <div className="flex gap-2">
                <Selector value={agregar} onChange={(e) => setAgregar(e.target.value)}>
                  <option value="">Vincular un miembro…</option>
                  {miembros.filter((x) => x.activo && !abierto.integrantes.includes(x.id)).map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                </Selector>
                <Boton
                  disabled={!agregar}
                  onClick={() => {
                    cambiar(abierto.id, (m) => ({ ...m, integrantes: [...m.integrantes, agregar] }));
                    setAgregar("");
                  }}
                >
                  Agregar
                </Boton>
              </div>
            )}
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {abierto.integrantes.map((id) => (
                <li key={id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>
                    {nombre(id)} {id === abierto.coordinadorId && <Etiqueta tono="indigo">Coordinador</Etiqueta>}
                  </span>
                  {puedeEditar(abierto) && id !== abierto.coordinadorId && (
                    <button
                      className="text-slate-400 hover:text-red-600"
                      aria-label="Quitar del ministerio"
                      onClick={() => cambiar(abierto.id, (m) => ({ ...m, integrantes: m.integrantes.filter((x) => x !== id) }))}
                    >
                      <UserMinus size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Actividades programadas</h3>
              <ul className="space-y-1 text-sm text-slate-600">
                {eventos
                  .filter((e) => e.ministerioId === abierto.id && e.fecha >= hoy)
                  .map((e) => <li key={e.id}>{fechaCorta(e.fecha)} · {e.hora} · {e.titulo}</li>)}
              </ul>
            </div>
          </>
        )}
      </Modal>

      <Modal
        titulo="Nuevo ministerio"
        abierto={!!nuevo}
        alCerrar={() => setNuevo(null)}
        pie={<><Boton variante="secundario" onClick={() => setNuevo(null)}>Cancelar</Boton><Boton onClick={crear}>Crear</Boton></>}
      >
        {nuevo && (
          <>
            <Campo etiqueta="Nombre"><Entrada value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} /></Campo>
            <Campo etiqueta="Descripción"><AreaTexto value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} /></Campo>
            <Campo etiqueta="Coordinador">
              <Selector value={nuevo.coordinadorId} onChange={(e) => setNuevo({ ...nuevo, coordinadorId: e.target.value })}>
                <option value="">Sin asignar</option>
                {miembros.filter((x) => x.activo).map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
              </Selector>
            </Campo>
          </>
        )}
      </Modal>
    </>
  );
}
