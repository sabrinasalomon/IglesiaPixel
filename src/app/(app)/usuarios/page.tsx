"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Boton, Campo, Encabezado, Entrada, Etiqueta, Modal, Selector, SinAcceso, Tabla, Tarjeta, td, th } from "@/components/ui";
import { nombreRol, ROLES } from "@/lib/catalogos";
import { acceso } from "@/lib/permisos";
import { nuevoId, useDatos } from "@/lib/store";
import type { Rol } from "@/lib/types";

export default function Usuarios() {
  const { db, usuario, actualizar, sedeId } = useDatos();
  const [form, setForm] = useState<{ nombre: string; correo: string; rol: Rol; sedeId: string } | null>(null);

  const permiso = acceso(usuario!.rol, "usuarios");
  if (!permiso) return <SinAcceso />;
  const puedeEditar = permiso === "total";
  const sede = (id: string) => db.sedes.find((s) => s.id === id)?.nombre;

  // En la Fase 1 esto crea la cuenta en Supabase Auth y envía la invitación por correo
  const guardar = () => {
    if (!form?.nombre.trim() || !form.correo.trim()) return;
    actualizar((d) => ({ ...d, usuarios: [...d.usuarios, { id: nuevoId("u"), activo: true, ...form }] }));
    setForm(null);
  };

  const alternar = (id: string) =>
    actualizar((d) => ({ ...d, usuarios: d.usuarios.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)) }));

  return (
    <>
      <Encabezado
        titulo="Usuarios del sistema"
        descripcion="Cuentas de acceso y su rol"
        acciones={puedeEditar && <Boton onClick={() => setForm({ nombre: "", correo: "", rol: "secretario", sedeId })}><Plus size={16} /> Nuevo usuario</Boton>}
      />
      <Tarjeta>
        <Tabla>
          <thead>
            <tr><th className={th}>Nombre</th><th className={th}>Correo</th><th className={th}>Rol</th><th className={th}>Sede</th><th className={th}>Estado</th>{puedeEditar && <th className={th}></th>}</tr>
          </thead>
          <tbody>
            {db.usuarios.map((u) => (
              <tr key={u.id}>
                <td className={`${td} font-medium text-slate-900`}>{u.nombre}</td>
                <td className={td}>{u.correo}</td>
                <td className={td}><Etiqueta tono="indigo">{nombreRol(u.rol)}</Etiqueta></td>
                <td className={td}>{sede(u.sedeId)}</td>
                <td className={td}>{u.activo ? <Etiqueta tono="verde">Activo</Etiqueta> : <Etiqueta>Bloqueado</Etiqueta>}</td>
                {puedeEditar && (
                  <td className={`${td} text-right`}>
                    {u.id !== usuario!.id && (
                      <Boton variante={u.activo ? "peligro" : "secundario"} className="py-1" onClick={() => alternar(u.id)}>
                        {u.activo ? "Bloquear" : "Activar"}
                      </Boton>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Tabla>
      </Tarjeta>

      <Modal
        titulo="Nuevo usuario"
        abierto={!!form}
        alCerrar={() => setForm(null)}
        pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton onClick={guardar}>Crear y enviar invitación</Boton></>}
      >
        {form && (
          <>
            <Campo etiqueta="Nombre"><Entrada value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Campo>
            <Campo etiqueta="Correo"><Entrada type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} /></Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Rol">
                <Selector value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}>
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </Selector>
              </Campo>
              <Campo etiqueta="Sede">
                <Selector value={form.sedeId} onChange={(e) => setForm({ ...form, sedeId: e.target.value })}>
                  {db.sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </Selector>
              </Campo>
            </div>
            <p className="text-xs text-slate-500">El usuario recibirá un correo para crear su contraseña.</p>
          </>
        )}
      </Modal>
    </>
  );
}
