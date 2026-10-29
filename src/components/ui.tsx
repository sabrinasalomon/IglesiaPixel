"use client";

import { Inbox, Lock, X } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

// Componentes básicos de interfaz compartidos por todos los módulos. El estilo es
// de pixel art: esquinas rectas, bordes gruesos y sombras duras sin desenfoque.

const unir = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

// Elevación suave al pasar el cursor, para tarjetas sueltas (no para tablas)
export const elevar = "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-[3px] hover:shadow-[3px_6px_0_0_rgb(36_28_21/0.35)]";

export function Tarjeta({ className, ...p }: ComponentProps<"div">) {
  return <div className={unir("pixel-suave bg-piedra-50", className)} {...p} />;
}

// Tres tratamientos en toda la app: primario dorado para crear, guardar o
// confirmar; secundario claro con borde fino para lo demás; y deshabilitado gris.
type Variante = "primario" | "secundario" | "peligro" | "fantasma";
const VARIANTES: Record<Variante, string> = {
  primario: "border border-piedra-900 bg-dorado-400 text-piedra-950 shadow-[2px_2px_0_0_var(--color-piedra-900)] hover:bg-dorado-300",
  secundario: "border border-piedra-400 bg-piedra-50 text-piedra-800 hover:border-piedra-700 hover:bg-white",
  peligro: "border border-liston-600 bg-piedra-50 text-liston-700 hover:bg-liston-50",
  fantasma: "text-piedra-600 hover:bg-piedra-200/60 hover:text-piedra-900",
};

export function Boton({
  variante = "primario",
  className,
  ...p
}: ComponentProps<"button"> & { variante?: Variante }) {
  return (
    <button
      className={unir(
        // Al presionar, el botón baja hasta su sombra, como una tecla
        "inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-bold transition-[background-color,transform,box-shadow] duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-400 focus-visible:ring-offset-2 focus-visible:ring-offset-piedra-50 enabled:active:translate-x-[2px] enabled:active:translate-y-[2px] enabled:active:shadow-none disabled:cursor-not-allowed disabled:border-piedra-300! disabled:bg-piedra-200! disabled:text-piedra-500! disabled:shadow-none!",
        VARIANTES[variante],
        className
      )}
      {...p}
    />
  );
}

// block: como inline dejarían bajo la línea el hueco de los descendentes
const campo =
  "block w-full border-2 border-piedra-700 bg-white px-3 py-2 text-sm text-piedra-900 shadow-[inset_2px_2px_0_0_var(--color-piedra-200)] outline-none transition placeholder:text-piedra-400 focus:border-marca-600 focus:ring-4 focus:ring-dorado-300/60 disabled:bg-piedra-100 disabled:text-piedra-500";

export function Entrada({ className, ...p }: ComponentProps<"input">) {
  return <input className={unir(campo, className)} {...p} />;
}

export function AreaTexto({ className, ...p }: ComponentProps<"textarea">) {
  return <textarea className={unir(campo, "min-h-24", className)} {...p} />;
}

export function Selector({ className, ...p }: ComponentProps<"select">) {
  return <select className={unir(campo, "cursor-pointer", className)} {...p} />;
}

export function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-bold text-piedra-700">{etiqueta}</span>
      {children}
    </label>
  );
}

type Tono = "gris" | "verde" | "rojo" | "ambar" | "marca" | "liston";
const TONOS: Record<Tono, string> = {
  gris: "bg-piedra-100 text-piedra-700 ring-piedra-500/60",
  verde: "bg-olivo-50 text-olivo-700 ring-olivo-600/70",
  rojo: "bg-liston-50 text-liston-700 ring-liston-600/70",
  ambar: "bg-dorado-100 text-dorado-700 ring-dorado-600/70",
  marca: "bg-marca-50 text-marca-700 ring-marca-600/60",
  liston: "bg-liston-50 text-liston-700 ring-liston-600/70",
};

export function Etiqueta({ tono = "gris", children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span
      className={unir(
        "inline-flex items-center whitespace-nowrap px-2 py-0.5 text-xs font-bold ring-2 ring-inset",
        TONOS[tono]
      )}
    >
      {children}
    </span>
  );
}

// Cinta con punta en V que cuelga del borde superior de su contenedor
// (que debe tener position: relative). Marca lo importante.
export function Liston({ className }: { className?: string }) {
  return <span aria-hidden className={unir("liston pointer-events-none absolute top-0 w-2.5 bg-liston-600", className ?? "left-5 h-6")} />;
}

export function Encabezado({
  titulo,
  descripcion,
  acciones,
  dibujo,
  fondo = "/pixel/fondo.jpg",
  children,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  /** Con dibujo, el encabezado es un cielo nocturno con el dibujo a la derecha */
  dibujo?: ReactNode;
  /** Imagen del lugar de la iglesia que va de fondo, fija */
  fondo?: string;
  /** Contenido extra bajo la descripción, como contadores */
  children?: ReactNode;
}) {
  if (dibujo) {
    return (
      <section
        className="pixel relative mb-6 flex items-end justify-between gap-6 overflow-hidden bg-piedra-900 bg-cover px-6 pt-6 text-white [image-rendering:pixelated] sm:px-8"
        style={{ backgroundImage: `url(${fondo})`, backgroundPosition: fondo === "/pixel/fondo.jpg" ? "center 8%" : "center" }}
      >
        {/* Sombra a la izquierda para que el texto se lea sobre el fondo */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-piedra-950/85 via-piedra-950/45 to-transparent" />
        <div className="relative pb-6">
          <h1 className="font-titulo text-4xl font-semibold leading-tight">{titulo}</h1>
          {descripcion && <p className="mt-1 text-piedra-100">{descripcion}</p>}
          {children}
          {acciones && <div className="mt-5 flex flex-wrap gap-2">{acciones}</div>}
        </div>
        <div className="relative hidden shrink-0 self-end pb-3 sm:block">{dibujo}</div>
      </section>
    );
  }
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-titulo text-4xl font-semibold leading-tight text-piedra-900">{titulo}</h1>
        {descripcion && <p className="mt-1 text-piedra-600">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

export function Modal({
  titulo,
  abierto,
  alCerrar,
  children,
  pie,
}: {
  titulo: string;
  abierto: boolean;
  alCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
}) {
  if (!abierto) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex animate-aparecer items-center justify-center bg-marca-950/60 p-4"
      onClick={alCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="pixel max-h-[90vh] w-full max-w-lg animate-emerger overflow-y-auto bg-piedra-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-[3px] border-piedra-900 bg-marca-800 px-6 py-3.5">
          <h2 className="font-titulo text-[1.375rem] font-medium leading-tight text-white">{titulo}</h2>
          <button
            onClick={alCerrar}
            className="p-1.5 text-marca-100 transition hover:bg-marca-700 hover:text-white"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">{children}</div>
        {pie && <div className="flex justify-end gap-2 border-t-2 border-piedra-300 bg-piedra-100 px-6 py-3.5">{pie}</div>}
      </div>
    </div>
  );
}

export function Tabla({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-dorado-100/60 [&_tbody_tr:last-child_td]:border-b-0">
        {children}
      </table>
    </div>
  );
}

export const th = "border-b-2 border-piedra-800 bg-piedra-100 px-4 py-2.5 font-titulo text-[13px] font-medium text-piedra-700";
export const td = "border-b border-piedra-200 px-4 py-3 text-piedra-700";

export function Vacio({ children, dibujo }: { children: ReactNode; dibujo?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      {dibujo ? <div className="mb-3 opacity-80">{dibujo}</div> : <Inbox size={22} className="mb-2 text-piedra-300" />}
      <p className="text-sm text-piedra-500">{children}</p>
    </div>
  );
}

export function SinAcceso() {
  return (
    <Tarjeta className="flex flex-col items-center p-12 text-center">
      <Lock size={22} className="mb-3 text-piedra-400" />
      <p className="font-titulo text-xl font-semibold text-piedra-900">No tienes acceso a este módulo</p>
      <p className="mt-1 text-sm text-piedra-500">Tu rol no tiene permiso para ver esta información.</p>
    </Tarjeta>
  );
}

// Banda de cifras separadas por filetes, como los totales de un libro de registro.
// Las celdas crecen para llenar cada fila, así no quedan huecos con 4 o 5 cifras.
export function Indicadores({ children }: { children: ReactNode }) {
  return (
    <Tarjeta className="overflow-hidden">
      <dl className="-ml-0.5 -mt-0.5 flex flex-wrap">{children}</dl>
    </Tarjeta>
  );
}

export function Indicador({ titulo, valor, detalle }: { titulo: string; valor: ReactNode; detalle?: string }) {
  return (
    <div className="min-w-0 flex-1 basis-40 border-l-2 border-t-2 border-piedra-300 px-5 py-4">
      <dt className="text-sm font-semibold text-piedra-600">{titulo}</dt>
      <dd className="mt-1 font-titulo text-4xl font-medium leading-none text-piedra-900 tabular-nums lining-nums">
        {typeof valor === "number" ? <Contador valor={valor} /> : valor}
      </dd>
      {detalle && <dd className="mt-2 text-xs text-piedra-500">{detalle}</dd>}
    </div>
  );
}

// Cuenta desde cero hasta la cifra al aparecer, como un marcador de puntos.
// Quien desactiva las animaciones ve la cifra final de inmediato.
export function Contador({ valor, formato = (n: number) => n.toLocaleString("es-MX") }: { valor: number; formato?: (n: number) => string }) {
  const [mostrado, setMostrado] = useState(valor);
  const anterior = useRef(0);
  useEffect(() => {
    const desde = anterior.current;
    anterior.current = valor;
    if (desde === valor || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMostrado(valor);
      return;
    }
    const inicio = performance.now();
    const duracion = 700;
    let cuadro = 0;
    const paso = (t: number) => {
      const avance = Math.min(1, (t - inicio) / duracion);
      const suave = 1 - (1 - avance) ** 3;
      setMostrado(Math.round(desde + (valor - desde) * suave));
      if (avance < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [valor]);
  return <>{formato(mostrado)}</>;
}

// Dibujo en pixel art de /public/pixel. Decorativo: no lo leen los lectores de pantalla.
export function Sprite({ nombre, ancho, className }: { nombre: "iglesia" | "cruz" | "biblia" | "persona"; ancho: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- imagen fija y pequeña, sin optimizar a propósito
  return <img src={`/pixel/${nombre}.png`} alt="" aria-hidden width={ancho} className={unir("sprite h-auto", className)} style={{ width: ancho }} />;
}

// El papa en pixel art, quieto y de frente (cuadro 2 de la hoja de poses).
// Se ve nítido a 131 px de alto (su tamaño real) o al doble; otras medidas
// deforman los cuadritos.
export function Papa({ alto = 131, className }: { alto?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={unir("block bg-[url(/pixel/papa.png)] bg-[length:500%_100%] bg-[position:50%_0] bg-no-repeat [image-rendering:pixelated]", className)}
      style={{ width: (alto * 71) / 131, height: alto }}
    />
  );
}

// Dibujos de cada vista (generados en pixel art y recortados a 360 px por el
// lado largo). Se muestran a la mitad para que los cuadritos queden parejos.
const DIBUJOS = {
  campanario: [117, 360],
  bancas: [360, 208],
  musicos: [360, 304],
  avisos: [282, 360],
  ofrenda: [341, 360],
  libro: [360, 252],
  sedes: [360, 301],
  llaves: [297, 360],
  vitral: [356, 360],
} as const;

export function Dibujo({ nombre, className }: { nombre: keyof typeof DIBUJOS; className?: string }) {
  const [ancho, alto] = DIBUJOS[nombre];
  // eslint-disable-next-line @next/next/no-img-element -- imagen fija y pequeña, sin optimizar a propósito
  return <img src={`/pixel/${nombre}.png`} alt="" aria-hidden width={ancho / 2} height={alto / 2} className={unir("sprite", className)} />;
}

// Cuadrito con las iniciales; el color sale del nombre para que cada persona
// conserve siempre el suyo.
const COLORES_AVATAR = ["bg-marca-700", "bg-liston-600", "bg-olivo-500", "bg-dorado-500", "bg-marca-500", "bg-piedra-700"];

export function Avatar({ nombre }: { nombre: string }) {
  const iniciales = nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  const color = COLORES_AVATAR[[...nombre].reduce((suma, letra) => suma + letra.charCodeAt(0), 0) % COLORES_AVATAR.length];
  return (
    <span aria-hidden className={`inline-flex h-8 w-8 shrink-0 items-center justify-center border-2 border-piedra-900 font-titulo text-xs font-semibold text-white ${color}`}>
      {iniciales}
    </span>
  );
}

// Pestañas tipo botón de juego: la elegida se hunde y se pinta de dorado
export function Pestanas<T extends string>({ opciones, valor, alCambiar }: { opciones: { valor: T; texto: string; cuenta?: number }[]; valor: T; alCambiar: (v: T) => void }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {opciones.map((o) => {
        const activa = o.valor === valor;
        return (
          <button
            key={o.valor}
            role="tab"
            aria-selected={activa}
            onClick={() => alCambiar(o.valor)}
            className={unir(
              "inline-flex items-center gap-2 border-2 border-piedra-900 px-3 py-1.5 text-sm font-bold transition-[background-color,transform,box-shadow] duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-400",
              activa ? "translate-x-[2px] translate-y-[2px] bg-dorado-300 text-piedra-950" : "bg-piedra-50 text-piedra-700 shadow-[2px_2px_0_0_var(--color-piedra-900)] hover:bg-dorado-100"
            )}
          >
            {o.texto}
            {o.cuenta !== undefined && <span className={unir("px-1.5 font-titulo text-xs", activa ? "bg-piedra-950 text-dorado-300" : "bg-piedra-200 text-piedra-700")}>{o.cuenta}</span>}
          </button>
        );
      })}
    </div>
  );
}
