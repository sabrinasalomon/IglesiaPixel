"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { AreaTexto, Boton, Campo, Contador, Dibujo, Encabezado, Entrada, Etiqueta, Liston, Modal, Selector, SinAcceso, Tarjeta, Vacio, elevar } from "@/components/ui";
import { aFecha, fechaLarga, MESES } from "@/lib/formato";
import { acceso } from "@/lib/permisos";
import type { DatosAnuncio } from "@/lib/repositorio/tipos";
import { useDatos } from "@/lib/store";
import type { Anuncio } from "@/lib/types";
import { intentar, useCarga } from "@/lib/usar-carga";

export default function Comunicados() {
  const { db, usuario, repo, sedeId, hoy } = useDatos();
  const cargar = useCallback(() => repo.anuncios.listar(sedeId), [repo, sedeId]);
  const { datos: anuncios, cargando, error, recargar } = useCarga<Anuncio[]>(cargar, []);
  const [form, setForm] = useState<DatosAnuncio | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [errorForm, setErrorForm] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [guardando, setGuardando] = useState(false);

  const permiso = acceso(usuario!.rol, "comunicados");
  if (!permiso) return <SinAcceso />;
  const puedeEditar = permiso === "total";

  // Quien solo consulta ve los anuncios ya publicados
  const lista = [...anuncios]
    .filter((a) => puedeEditar || a.fechaPublicacion <= hoy)
    .sort((a, b) => b.fechaPublicacion.localeCompare(a.fechaPublicacion));
  // Pastor y secretario solo administran los anuncios de su sede
  const administra = (a: Anuncio) => puedeEditar && (usuario!.rol === "administrador" || a.sedeId === usuario!.sedeId);

  const abrir = (datos: DatosAnuncio, id: string | null) => {
    setEditandoId(id);
    setErrorForm("");
    setForm(datos);
  };

  const guardar = async () => {
    if (!form) return;
    if (!form.titulo.trim()) return setErrorForm("El título es obligatorio.");
    setGuardando(true);
    const fallo = await intentar(() => (editandoId ? repo.anuncios.editar(editandoId, form) : repo.anuncios.crear(form)));
    setGuardando(false);
    if (fallo) return setErrorForm(fallo);
    setForm(null);
    recargar();
  };

  const eliminar = async (id: string) => {
    setErrorAccion(await intentar(() => repo.anuncios.eliminar(id)));
    recargar();
  };

  return (
    <>
      <Encabezado
        titulo="Comunicados y anuncios"
        descripcion="Los miembros ven estos avisos al iniciar sesión"
        acciones={
          puedeEditar && (
            <Boton onClick={() => abrir({ titulo: "", contenido: "", fechaPublicacion: hoy, importante: false, sedeId }, null)}>
              <Plus size={16} /> Nuevo anuncio
            </Boton>
          )
        }
        dibujo={<Dibujo nombre="avisos" />}
        fondo="/pixel/fondo-comunicados.jpg"
      >
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {[
            ["Publicados", lista.filter((a) => a.fechaPublicacion <= hoy).length],
            ["Importantes", lista.filter((a) => a.importante).length],
            ...(puedeEditar ? [["Programados", lista.filter((a) => a.fechaPublicacion > hoy).length]] : []),
          ].map(([texto, valor]) => (
            <div key={texto}>
              <dt className="text-xs font-bold uppercase tracking-wider text-dorado-300">{texto}</dt>
              <dd className="font-titulo text-3xl font-semibold"><Contador valor={valor as number} /></dd>
            </div>
          ))}
        </dl>
      </Encabezado>
      {(error || errorAccion) && <p className="mb-4 bg-liston-50 px-3 py-2 text-sm text-liston-700">{error || errorAccion}</p>}
      {cargando && <Vacio>Cargando…</Vacio>}
      {!cargando && lista.length === 0 && <Tarjeta><Vacio>No hay anuncios publicados.</Vacio></Tarjeta>}
      {/* Tablón de avisos: cada anuncio es una hoja clavada con una tachuela */}
      <div className="grid gap-5 md:grid-cols-2">
        {lista.map((a) => {
          const fecha = aFecha(a.fechaPublicacion);
          return (
            <Tarjeta key={a.id} className={`relative flex gap-4 p-5 pt-6 ${elevar} ${a.importante ? "border-liston-700!" : ""}`}>
              <span aria-hidden className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 border-2 border-piedra-900 bg-liston-600" />
              {a.importante && <Liston className="left-1.5 h-10" />}
              <div className="flex w-14 shrink-0 flex-col items-center self-start border-2 border-piedra-900 bg-piedra-100 text-center">
                <span className="w-full bg-marca-900 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">{MESES[fecha.getMonth()].slice(0, 3)}</span>
                <span className="py-1 font-titulo text-2xl font-semibold text-piedra-900">{fecha.getDate()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-titulo text-lg font-semibold leading-snug text-piedra-900">{a.titulo}</h2>
                  {administra(a) && (
                    <div className="-mr-2 -mt-1 flex shrink-0">
                      <Boton variante="fantasma" className="px-2" aria-label="Editar" onClick={() => abrir({ titulo: a.titulo, contenido: a.contenido, fechaPublicacion: a.fechaPublicacion, importante: a.importante, sedeId: a.sedeId }, a.id)}>
                        <Pencil size={15} />
                      </Boton>
                      <Boton variante="fantasma" aria-label="Eliminar" className="px-2 hover:text-liston-600" onClick={() => eliminar(a.id)}>
                        <Trash2 size={15} />
                      </Boton>
                    </div>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {a.importante && <Etiqueta tono="liston">Importante</Etiqueta>}
                  {a.sedeId === null && <Etiqueta tono="marca">Todas las sedes</Etiqueta>}
                  {a.fechaPublicacion > hoy && <Etiqueta>Programado</Etiqueta>}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-piedra-700">{a.contenido}</p>
                <p className="mt-3 text-xs text-piedra-500">{fechaLarga(a.fechaPublicacion)}{a.autorNombre && ` · ${a.autorNombre}`}</p>
              </div>
            </Tarjeta>
          );
        })}
      </div>

      <Modal
        titulo={editandoId ? "Editar anuncio" : "Nuevo anuncio"}
        abierto={!!form}
        alCerrar={() => setForm(null)}
        pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton disabled={guardando} onClick={guardar}>Publicar</Boton></>}
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
            {errorForm && <p className="text-sm text-liston-600">{errorForm}</p>}
          </>
        )}
      </Modal>
    </>
  );
}
