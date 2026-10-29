"use client";

import { Lock, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Avatar, Boton, Campo, Contador, Dibujo, Encabezado, Entrada, Etiqueta, Modal, Selector, SinAcceso, Tabla, Tarjeta, Vacio, td, th } from "@/components/ui";
import { CONCEPTOS, METODOS } from "@/lib/catalogos";
import { fechaCorta, mesCorto, mxn } from "@/lib/formato";
import { acceso } from "@/lib/permisos";
import { useDatos } from "@/lib/store";
import type { Aportacion, ConceptoAportacion, MetodoPago, Miembro } from "@/lib/types";
import { intentar, useCarga } from "@/lib/usar-carga";

export default function Donaciones() {
  const { usuario, repo, sedeId, hoy } = useDatos();
  const permiso = acceso(usuario!.rol, "donaciones");
  const cargar = useCallback(async () => {
    if (!permiso) return { todas: [], miembros: [] };
    const [todas, miembros] = await Promise.all([repo.aportaciones.listar(sedeId), repo.miembros.listar(sedeId)]);
    return { todas, miembros };
  }, [repo, sedeId, permiso]);
  const { datos, cargando, error, recargar } = useCarga<{ todas: Aportacion[]; miembros: Miembro[] }>(cargar, { todas: [], miembros: [] });
  const { todas, miembros } = datos;
  // Las anuladas se muestran en la lista pero no suman
  const aportaciones = useMemo(() => todas.filter((a) => !a.anulada), [todas]);
  const [desde, setDesde] = useState(`${hoy.slice(0, 7)}-01`);
  const [hasta, setHasta] = useState(hoy);
  const [form, setForm] = useState<{ fecha: string; monto: string; concepto: ConceptoAportacion; metodo: MetodoPago; miembroId: string; anonima: boolean } | null>(null);
  const [errorForm, setErrorForm] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [guardando, setGuardando] = useState(false);

  const movimientos = useMemo(
    () => todas.filter((a) => a.fecha >= desde && a.fecha <= hasta).sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [todas, desde, hasta]
  );
  const enPeriodo = useMemo(() => movimientos.filter((a) => !a.anulada), [movimientos]);

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

  const guardar = async () => {
    if (!form) return;
    const monto = Math.round(Number(form.monto) * 100) / 100;
    if (!(monto > 0)) return setErrorForm("Escribe un monto mayor a cero.");
    if (!form.fecha) return setErrorForm("Indica la fecha.");
    setGuardando(true);
    const fallo = await intentar(() =>
      repo.aportaciones.crear(sedeId, {
        fecha: form.fecha,
        monto,
        concepto: form.concepto,
        metodo: form.metodo,
        miembroId: form.anonima || !form.miembroId ? undefined : form.miembroId,
      })
    );
    setGuardando(false);
    if (fallo) return setErrorForm(fallo);
    setForm(null);
    recargar();
  };

  // Una aportación con error no se borra: se anula y se registra de nuevo
  const alternarAnulada = async (a: Aportacion) => {
    setErrorAccion(await intentar(() => repo.aportaciones.cambiarAnulada(a.id, !a.anulada)));
    recargar();
  };

  return (
    <>
      <Encabezado
        titulo="Donaciones y aportaciones"
        descripcion="Información financiera restringida a administración, pastor y tesorería"
        acciones={
          puedeRegistrar && (
            <Boton onClick={() => { setErrorForm(""); setForm({ fecha: hoy, monto: "", concepto: "Diezmo", metodo: "Efectivo", miembroId: "", anonima: false }); }}>
              <Plus size={16} /> Registrar aportación
            </Boton>
          )
        }
        dibujo={<Dibujo nombre="ofrenda" />}
        fondo="/pixel/fondo-donaciones.jpg"
      >
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {[
            ["Total del periodo", total, mxn],
            ["Aportaciones", enPeriodo.length, undefined],
            ["Diezmos", enPeriodo.filter((a) => a.concepto === "Diezmo").reduce((s, a) => s + a.monto, 0), mxn],
          ].map(([texto, valor, formato]) => (
            <div key={texto as string}>
              <dt className="text-xs font-bold uppercase tracking-wider text-dorado-300">{texto as string}</dt>
              <dd className="font-titulo text-3xl font-semibold"><Contador valor={valor as number} formato={formato as ((n: number) => string) | undefined} /></dd>
            </div>
          ))}
        </dl>
      </Encabezado>
      {!puedeRegistrar && (
        <p className="mb-4 flex items-center gap-2 bg-dorado-50 px-3 py-2 text-sm text-dorado-800">
          <Lock size={14} /> Tienes acceso de solo lectura.
        </p>
      )}
      {(error || errorAccion) && <p className="mb-4 bg-liston-50 px-3 py-2 text-sm text-liston-700">{error || errorAccion}</p>}

      <Tarjeta className="mb-4 flex flex-wrap items-end gap-3 p-4">
        <Campo etiqueta="Desde"><Entrada type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></Campo>
        <Campo etiqueta="Hasta"><Entrada type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></Campo>
        <div className="flex gap-2">
          {[
            ["Este mes", `${hoy.slice(0, 7)}-01`],
            ["Este año", `${hoy.slice(0, 4)}-01-01`],
          ].map(([texto, inicio]) => (
            <Boton key={texto} variante={desde === inicio && hasta === hoy ? "primario" : "secundario"} onClick={() => { setDesde(inicio); setHasta(hoy); }}>
              {texto}
            </Boton>
          ))}
        </div>
        <p className="ml-auto text-sm text-piedra-500">{enPeriodo.length} aportaciones · <span className="font-titulo text-lg font-semibold text-piedra-900">{mxn(total)}</span></p>
      </Tarjeta>

      <div className="flex flex-col gap-4">
        <Tarjeta className="order-2">
          <h2 className="border-b-2 border-piedra-200 p-4 font-titulo text-xl font-semibold">Movimientos del periodo</h2>
          <div className="max-h-[520px] overflow-y-auto">
            <Tabla>
              <thead>
                <tr>
                  <th className={th}>Fecha</th><th className={th}>Concepto</th><th className={th}>Aportante</th><th className={th}>Método</th><th className={`${th} text-right!`}>Monto</th>
                  {puedeRegistrar && <th className={th}></th>}
                </tr>
              </thead>
              <tbody>
                {movimientos.map((a) => (
                  <tr key={a.id} className={a.anulada ? "bg-piedra-50 text-piedra-400" : ""}>
                    <td className={`${td} whitespace-nowrap`}>{fechaCorta(a.fecha)}</td>
                    <td className={td}>{a.concepto} {a.anulada && <Etiqueta tono="rojo">Anulada</Etiqueta>}</td>
                    <td className={td}>
                      {nombre(a.miembroId) ? (
                        <span className="flex items-center gap-2 whitespace-nowrap" title={nombre(a.miembroId)}><Avatar nombre={nombre(a.miembroId)!} /> {nombre(a.miembroId)!.split(" ").slice(0, 2).join(" ")}</span>
                      ) : (
                        <Etiqueta>Anónimo</Etiqueta>
                      )}
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{a.metodo}</td>
                    <td className={`${td} whitespace-nowrap text-right font-titulo font-semibold ${a.anulada ? "line-through" : "text-olivo-800"}`}>{mxn(a.monto)}</td>
                    {puedeRegistrar && (
                      <td className={`${td} text-right`}>
                        <button className="text-xs text-piedra-500 hover:text-liston-600" onClick={() => alternarAnulada(a)}>
                          {a.anulada ? "Restaurar" : "Anular"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Tabla>
            {cargando ? <Vacio>Cargando…</Vacio> : movimientos.length === 0 && <Vacio>No hay aportaciones en este periodo.</Vacio>}
          </div>
        </Tarjeta>

        <div className="order-1 grid items-start gap-4 lg:grid-cols-2">
          <Tarjeta className="p-4">
            <h2 className="mb-3 font-titulo text-xl font-semibold">Por concepto</h2>
            <ul className="space-y-2 text-sm">
              {porConcepto.map(([c, monto]) => (
                <li key={c}>
                  <div className="flex justify-between"><span>{c}</span><span className="font-medium">{mxn(monto)}</span></div>
                  <Bloques valor={monto} total={total} etiqueta={c} />
                </li>
              ))}
            </ul>
          </Tarjeta>
          <Tarjeta>
            <h2 className="border-b-2 border-piedra-200 p-4 font-titulo text-xl font-semibold">Resumen mensual</h2>
            <Tabla>
              <thead><tr><th className={th}>Mes</th><th className={`${th} text-right!`}>Diezmos</th><th className={`${th} text-right!`}>Total</th></tr></thead>
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
        pie={<><Boton variante="secundario" onClick={() => setForm(null)}>Cancelar</Boton><Boton disabled={guardando} onClick={guardar}>Guardar</Boton></>}
      >
        {form && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Fecha"><Entrada type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Campo>
              <Campo etiqueta="Monto (MXN)"><Entrada type="number" min="1" step="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} /></Campo>
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
                  {miembros.filter((m) => m.activo).map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </Selector>
              </Campo>
            )}
            {errorForm && <p className="text-sm text-liston-600">{errorForm}</p>}
          </>
        )}
      </Modal>
    </>
  );
}

// Barra por bloques, igual que en asistencia
function Bloques({ valor, total, etiqueta }: { valor: number; total: number; etiqueta: string }) {
  const bloques = 16;
  const llenos = total ? Math.max(1, Math.round((valor / total) * bloques)) : 0;
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={valor}
      aria-label={etiqueta}
      className="mt-1 grid h-4 gap-0.5 border-2 border-piedra-900 bg-piedra-200 p-0.5"
      style={{ gridTemplateColumns: `repeat(${bloques}, 1fr)` }}
    >
      {Array.from({ length: bloques }, (_, i) => (
        <span key={i} className={i < llenos ? "bg-dorado-600" : "bg-piedra-50"} />
      ))}
    </div>
  );
}
