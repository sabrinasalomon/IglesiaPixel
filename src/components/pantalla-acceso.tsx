import { Building2, CalendarDays, HandCoins, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

const FUNCIONES = [
  { icono: <Users size={18} />, texto: "Miembros y asistencia" },
  { icono: <CalendarDays size={18} />, texto: "Eventos y ministerios" },
  { icono: <HandCoins size={18} />, texto: "Donaciones y reportes" },
  { icono: <Building2 size={18} />, texto: "Varias sedes en un solo sistema" },
];

// Marco de las pantallas sin sesión (inicio de sesión y restablecer contraseña):
// panel de identidad a la izquierda en escritorio y el formulario a la derecha.
export function PantallaAcceso({
  nombre,
  logoUrl,
  titulo,
  subtitulo,
  children,
}: {
  nombre: string;
  logoUrl?: string | null;
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-marca-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-marca-500/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 right-0 h-[26rem] w-[26rem] rounded-full bg-dorado-500/15 blur-3xl" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:24px_24px]"
        />

        <div className="relative flex items-center gap-3">
          <Logo url={logoUrl} tamano={44} />
          <p className="font-titulo text-lg font-semibold">{nombre}</p>
        </div>

        <div className="relative max-w-lg">
          <h2 className="font-titulo text-4xl font-semibold leading-tight xl:text-5xl">
            Cuida a tu congregación, <span className="text-dorado-300">sede por sede.</span>
          </h2>
          <p className="mt-4 text-marca-100/70">
            Lleva el registro de tu iglesia en un solo lugar, con la información que cada rol necesita.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {FUNCIONES.map((f) => (
              <li key={f.texto} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm ring-1 ring-inset ring-white/10">
                <span className="text-dorado-300">{f.icono}</span>
                {f.texto}
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative border-l-2 border-dorado-400/60 pl-4">
          <blockquote className="font-titulo text-lg italic text-marca-50/90">“Hágase todo decentemente y con orden.”</blockquote>
          <figcaption className="mt-1 text-xs text-marca-200/60">1 Corintios 14:40</figcaption>
        </figure>
      </section>

      <section className="flex items-center justify-center bg-gradient-to-br from-marca-50 via-white to-dorado-50/60 p-6 lg:bg-none lg:bg-white">
        <div className="w-full max-w-sm animate-emerger">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo url={logoUrl} tamano={44} />
            <p className="font-titulo text-lg font-semibold text-slate-900">{nombre}</p>
          </div>
          <h1 className="font-titulo text-3xl font-semibold tracking-tight text-slate-900">{titulo}</h1>
          {subtitulo && <p className="mt-2 text-sm text-slate-500">{subtitulo}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </div>
  );
}
