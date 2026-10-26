"use client";

import { Lock, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Boton, Campo, Encabezado, Entrada, Etiqueta, Modal, Selector, SinAcceso, Tabla, Tarjeta, td, th } from "@/components/ui";
import { CONCEPTOS, METODOS } from "@/lib/catalogos";
import { fechaCorta, mesCorto, mxn } from "@/lib/formato";
import { acceso } from "@/lib/permisos";
import { nuevoId, useDatos, useSede } from "@/lib/store";
import type { ConceptoAportacion, MetodoPago } from "@/lib/types";

export default function Donaciones() {
  const { usuario, actualizar, sedeId, hoy } = useDatos();
  const { aportaciones, miembros } = useSede();
  const [desde, setDesde] = useState(`${hoy.slice(0, 7)}-01`);
  const [hasta, setHasta] = useState(hoy);
  const [form, setForm] = useState<{ fecha: string; monto: string; concepto: ConceptoAportacion; metodo: MetodoPago; miembroId: string; anonima: boolean } | null>(null);

  const permiso = acceso(usuario!.rol, "donaciones");

  const enPeriodo = useMemo(
    () => aportaciones.filter((a) => a.fecha >= desde && a.fecha <= hasta).sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [aportaciones, desde, hasta]
  );

  const porConcepto = useMemo(() => {
    const t = new Map<string, number>();
    enPeriodo.forEach((a) => t.set(a.concepto, (t.get(a.concepto) ?? 0) + a.monto));
    return [...t.entries()].sort((a, b) => b[1] - a[1]);
  }, [enPeriodo]);

  // Resumen mensual de los últimos 6 meses
  const resumen = useMemo(() => {
    const t = new Map<string, { total: number; diezmos: number; ofrendas: number; otros: number; n: number }>();
    aportaciones.forEach((a) => {
      const k = a.fecha.slice(0, 7);
      const r = t.get(k) ?? { total: 0, diezmos: 0, ofrendas: 0, otros: 0, n: 0 };
      r.total += a.monto;
      r.n++;
      if (a.concepto === "Diezmo") r.diezmos += a.monto;
      else if (a.concepto === "Ofrenda") r.ofrendas += a.monto;
      else r.otros += a.monto;
      t.set(k, r);
    });
    return [...t.entries()].sort(([a], [b]) => b.localeCompare(a)).slice(0, 6);
  }, [aportaciones]);

  if (!permiso) return <SinAcceso />;
  const puedeRegistrar = permiso === "total";
  const total = enPeriodo.reduce((s, a) => s + a.monto, 0);
  const nombre = (id?: string) => (id ? miembros.find((m) => m.id === id)?.nombre : undefined);

  const guardar = () => {
    if (!form || !(Number(form.monto) > 0)) return;
    actualizar((db) => ({
      ...db,
      aportaciones: [
        ...db.aportaciones,
        {
          id: nuevoId("a"),
          sedeId,
          fecha: form.fecha,
          monto: Number(form.monto),
          concepto: form.concepto,
          metodo: form.metodo,
          miembroId: form.anonima || !form.miembroId ? undefined : form.miembroId,
          registradoPor: usuario!.id,
        },
      ],
    }));
    setForm(null);
  };

  return (
    <>
      <Encabezado
        titulo="Donaciones y aportaciones"
        descripcion="Información financiera restringida a administración, pastor y tesorería"
        acciones={
          puedeRegistrar && (
            <Boton onClick={() => setForm({ fecha: hoy, monto: "", concepto: "Diezmo", metodo: "Efectivo", miembroId: "", anonima: false })}>
              <Plus size={16} /> Registrar aportación
            </Boton>
          )
        }
      />
      {!puedeRegistrar && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <Lock size={14} /> Tienes acceso de solo lectura.
        </p>
      )}

      <Tarjeta className="mb-4 flex flex-wrap items-end gap-3 p-4">
        <Campo etiqueta="Desde"><Entrada type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></Campo>
        <Campo etiqueta="Hasta"><Entrada type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></Campo>
        <div className="ml-auto text-right">
          <p className="text-xs text-slate-500">Total del periodo</p>
          <p className="text-2xl font-semibold">{mxn(total)}</p>
          <p className="text-xs text-slate-500">{enPeriodo.length} aportaciones</p>
        </div>
      </Tarjeta>

      <div className="grid gap-4 lg:grid-cols-3">
        <Tarjeta className="lg:col-span-2">
          <h2 className="border-b border-slate-200 p-4 font-semibold">Movimientos del periodo</h2>
          <div className="max-h-[520px] overflow-y-auto">
            <Tabla>
              <thead>
                <tr><th className={th}>Fecha</th><th className={th}>Concepto</th><th className={th}>Aportante</th><th className={th}>Método</th><th className={`${th} text-right`}>Monto</th></tr>
              </thead>
              <tbody>
                {enPeriodo.map((a) => (
                  <tr key={a.id}>
                    <td className={td}>{fechaCorta(a.fecha)}</td>
                    <td className={td}>{a.concepto}</td>
                    <td className={td}>{nombre(a.miembroId) ?? <Etiqueta>Anónimo</Etiqueta>}</td>
                    <td className={td}>{a.metodo}</td>
                    <td className={`${td} text-right font-medium`}>{mxn(a.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          </div>
        </Tarjeta>

        <div className="space-y-4">
          <Tarjeta className="p-4">
            <h2 className="mb-3 font-semibold">Por concepto</h2>
            <ul className="space-y-2 text-sm">
              {porConcepto.map(([c, monto]) => (
                <li key={c}>
                  <div className="flex justify-between"><span>{c}</span><span className="font-medium">{mxn(monto)}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${(monto / total) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Tarjeta>
          <Tarjeta>
            <h2 className="border-b border-slate-200 p-4 font-semibold">Resumen mensual</h2>
            <Tabla>
              <thead><tr><th className={th}>Mes</th><th className={`${th} text-right`}>Diezmos</th><th className={`${th} text-right`}>Total</th></tr></thead>
              <tbody>
                {resumen.map(([mes, r]) => (
                  <tr key={mes}>
                    <td className={`${td} capitalize`}>{mesCorto(mes)}</td>
                    <td className={`${td} text-right`}>{mxn(r.diezmos)}</td>
                    <td className={`${td} text-right font-medium`}>{mxn(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          </Tarjeta>
        </div>
      </div>

      <Modal
        titulo="Registrar aportación"
        abierto={!!form}
        alCerrar={() => setForm(null)}
        pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton onClick={guardar}>Guardar</Boton></>}
      >
        {form && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Fecha"><Entrada type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Campo>
              <Campo etiqueta="Monto (MXN)"><Entrada type="number" min="1" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} /></Campo>
              <Campo etiqueta="Concepto">
                <Selector value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value as ConceptoAportacion })}>
                  {CONCEPTOS.map((c) => <option key={c}>{c}</option>)}
                </Selector>
              </Campo>
              <Campo etiqueta="Método de recepción">
                <Selector value={form.metodo} onChange={(e) => setForm({ ...form, metodo: e.target.value as MetodoPago })}>
                  {METODOS.map((c) => <option key={c}>{c}</option>)}
                </Selector>
              </Campo>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.anonima} onChange={(e) => setForm({ ...form, anonima: e.target.checked })} />
              Aportación anónima
            </label>
            {!form.anonima && (
              <Campo etiqueta="Aportante (opcional)">
                <Selector value={form.miembroId} onChange={(e) => setForm({ ...form, miembroId: e.target.value })}>
                  <option value="">Sin asociar</option>
                  {miembros.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </Selector>
              </Campo>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
