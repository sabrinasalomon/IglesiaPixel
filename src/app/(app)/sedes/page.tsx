"use client";

import { Mail, MapPin, Phone, Plus } from "lucide-react";
import { useState } from "react";
import { Boton, Campo, Contador, Dibujo, Encabezado, Entrada, Etiqueta, Modal, SinAcceso, Sprite, Tarjeta } from "@/components/ui";
import { acceso } from "@/lib/permisos";
import type { DatosSede } from "@/lib/repositorio/tipos";
import { useDatos } from "@/lib/store";
import { intentar } from "@/lib/usar-carga";

export default function Sedes() {
  const { db, modo, usuario, repo, recargar, sedeId, cambiarSede } = useDatos();
  const [form, setForm] = useState<DatosSede | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  if (!acceso(usuario!.rol, "sedes")) return <SinAcceso />;

  const abrir = (id: string | null, datos: DatosSede) => {
    setEditandoId(id);
    setForm(datos);
    setError("");
  };

  const guardar = async () => {
    if (!form?.nombre.trim()) return setError("El nombre es obligatorio.");
    setGuardando(true);
    const fallo = await intentar(() => (editandoId ? repo.sedes.editar(editandoId, form) : repo.sedes.crear(form)));
    if (!fallo) await recargar();
    setGuardando(false);
    if (fallo) return setError(fallo);
    setForm(null);
  };

  return (
    <>
      <Encabezado
        titulo="Sedes"
        descripcion="Cada sede tiene sus propios miembros, eventos, ministerios y finanzas"
        acciones={<Boton onClick={() => abrir(null, { nombre: "", direccion: "", telefono: "", correo: "" })}><Plus size={16} /> Nueva sede</Boton>}
        dibujo={<Dibujo nombre="sedes" />}
        fondo="/pixel/fondo-sedes.jpg"
      >
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {[
            ["Sedes", db.sedes.length],
            ["Activas", db.sedes.filter((s) => s.activa).length],
          ].map(([texto, valor]) => (
            <div key={texto}>
              <dt className="text-xs font-bold uppercase tracking-wider text-dorado-300">{texto}</dt>
              <dd className="font-titulo text-3xl font-semibold"><Contador valor={valor as number} /></dd>
            </div>
          ))}
        </dl>
      </Encabezado>
      {db.sedes.length === 0 && (
        <Tarjeta className="p-8 text-center text-sm text-piedra-600">Aún no hay sedes. Registra la primera para empezar.</Tarjeta>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {db.sedes.map((s) => (
          <Tarjeta key={s.id} className={`flex flex-col transition-transform hover:-translate-y-1 ${s.id === sedeId ? "border-dorado-600!" : ""}`}>
            {/* Cabecera oscura con la iglesia, como en Ministerios */}
            <div className="flex items-center gap-3 border-b-2 border-piedra-900 bg-marca-900 px-5 py-3 text-white">
              <Sprite nombre="iglesia" ancho={60} />
              <div className="min-w-0 flex-1">
                <h2 className="font-titulo text-xl font-semibold leading-tight">{s.nombre}</h2>
                {s.id === sedeId && <span className="mt-1 inline-block bg-dorado-300 px-2 py-0.5 text-xs font-bold text-piedra-950">Trabajando aquí</span>}
              </div>
              {s.activa ? <Etiqueta tono="verde">Activa</Etiqueta> : <Etiqueta>Inactiva</Etiqueta>}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <ul className="space-y-1.5 text-sm text-piedra-600">
                <li className="flex gap-2"><MapPin size={15} className="mt-0.5 shrink-0" /> {s.direccion || "Sin dirección"}</li>
                <li className="flex gap-2"><Phone size={15} className="mt-0.5" /> {s.telefono || "—"}</li>
                <li className="flex gap-2"><Mail size={15} className="mt-0.5" /> {s.correo || "—"}</li>
              </ul>
              {modo === "demo" && (
                <dl className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    ["Miembros", db.miembros.filter((m) => m.sedeId === s.id && m.activo).length],
                    ["Ministerios", db.ministerios.filter((m) => m.sedeId === s.id).length],
                  ].map(([texto, valor]) => (
                    <div key={texto} className="border border-piedra-300 bg-piedra-50 px-3 py-2">
                      <dt className="text-xs font-bold uppercase tracking-wider text-piedra-500">{texto}</dt>
                      <dd className="font-titulo text-2xl font-semibold text-piedra-900">{valor}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="mt-auto flex gap-2 pt-4">
                <Boton variante="secundario" disabled={s.id === sedeId} onClick={() => cambiarSede(s.id)}>
                  {s.id === sedeId ? "Sede activa" : "Trabajar en esta sede"}
                </Boton>
                <Boton variante="secundario" onClick={() => abrir(s.id, { nombre: s.nombre, direccion: s.direccion, telefono: s.telefono, correo: s.correo })}>Editar</Boton>
              </div>
            </div>
          </Tarjeta>
        ))}
      </div>

      <Modal
        titulo={editandoId ? "Editar sede" : "Nueva sede"}
        abierto={!!form}
        alCerrar={() => setForm(null)}
        pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton disabled={guardando} onClick={guardar}>Guardar</Boton></>}
      >
        {form && (
          <>
            <Campo etiqueta="Nombre"><Entrada value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Campo>
            <Campo etiqueta="Dirección"><Entrada value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Teléfono"><Entrada value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></Campo>
              <Campo etiqueta="Correo"><Entrada type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} /></Campo>
            </div>
            {error && <p className="text-sm text-liston-600">{error}</p>}
          </>
        )}
      </Modal>
    </>
  );
}
