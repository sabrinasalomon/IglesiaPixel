import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { Sprite } from "@/components/ui";

// Estrellas del cielo nocturno: posición en % y retraso del parpadeo, fijos para
// que el servidor y el navegador dibujen lo mismo.
const ESTRELLAS = [
  [8, 12, 0], [22, 6, 1.1], [35, 18, 0.4], [48, 9, 2], [61, 15, 0.8], [74, 7, 1.6], [88, 13, 0.2],
  [14, 28, 1.4], [29, 34, 0.6], [56, 30, 1.9], [69, 26, 0.3], [83, 32, 1.2], [93, 24, 2.3], [42, 40, 1],
];

// Marco de las pantallas sin sesión (inicio de sesión y restablecer contraseña).
// En escritorio, a la izquierda va la "portada": la iglesia en pixel art bajo un
// cielo nocturno con estrellas; a la derecha, el formulario en una hoja de pergamino.
export function PantallaAcceso({
  nombre,
  logoUrl,
  titulo,
  subtitulo,
  entrando = false,
  alEntrar,
  escena,
  children,
}: {
  nombre: string;
  logoUrl?: string | null;
  titulo: string;
  subtitulo?: string;
  /** Al iniciar sesión, el humanito camina hasta la iglesia; alEntrar avisa cuando ya entró */
  entrando?: boolean;
  alEntrar?: () => void;
  /** Reemplaza la iglesia y el humanito por otra escena (la usa restablecer) */
  escena?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-marca-950 px-12 pt-12 text-marca-50 lg:flex lg:flex-col xl:px-16">
        {ESTRELLAS.map(([x, y, retraso], i) => (
          <span
            key={i}
            aria-hidden
            className={`absolute animate-titilar bg-dorado-200 ${i % 3 === 0 ? "h-1.5 w-1.5" : "h-1 w-1"}`}
            style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${retraso}s` }}
          />
        ))}

        <div className="relative flex items-center gap-3">
          <Logo url={logoUrl} tamano={40} claro />
          <p className="font-titulo text-xl font-medium">{nombre}</p>
        </div>

        <figure className="relative mt-12 max-w-lg">
          <blockquote className="font-titulo text-4xl font-medium leading-tight text-white xl:text-5xl">
            “Hágase todo decentemente y con orden.”
          </blockquote>
          <figcaption className="mt-4 text-marca-200">1 Corintios 14:40</figcaption>
        </figure>

        {escena ?? (
          <div className="relative mt-auto flex justify-center">
            <Sprite nombre="iglesia" ancho={300} className="relative z-10 -mb-3 xl:w-[340px]!" />
            {/* El humanito espera flotando junto al camino; al entrar, camina hasta la puerta */}
            <div
              className={`absolute bottom-0 z-20 -mb-2 ${entrando ? "animate-caminar" : "left-[6%] -translate-x-1/2"}`}
              onAnimationEnd={(e) => { if (e.animationName === "caminar") alEntrar?.(); }}
            >
              <Sprite nombre="persona" ancho={24} className={entrando ? "animate-paso" : "animate-flotar [animation-delay:1.2s]"} />
            </div>
          </div>
        )}
        {/* Pasto en escalones, como el suelo de un nivel */}
        <div aria-hidden className="relative -mx-12 h-14 border-t-4 border-olivo-300 bg-olivo-600 xl:-mx-16">
          <div className="h-3 bg-olivo-500" />
        </div>
      </section>

      <section className="flex items-center justify-center bg-papel p-6">
        <div className="pixel w-full max-w-sm animate-emerger bg-piedra-50 p-7 sm:p-8">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo url={logoUrl} tamano={40} />
            <p className="font-titulo text-xl font-medium text-piedra-900">{nombre}</p>
          </div>
          <h1 className="font-titulo text-4xl font-semibold leading-tight text-piedra-900">{titulo}</h1>
          {subtitulo && <p className="mt-2 text-piedra-600">{subtitulo}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </div>
  );
}
