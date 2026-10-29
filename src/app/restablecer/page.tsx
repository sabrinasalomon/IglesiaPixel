"use client";

import { Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PantallaAcceso } from "@/components/pantalla-acceso";
import { Boton, Campo, Entrada } from "@/components/ui";
import { useDatos } from "@/lib/store";
import { supabaseNavegador } from "@/lib/supabase/cliente";

// Destino de los enlaces de invitación y de recuperación de contraseña.
// Supabase abre la sesión a partir del enlace; aquí se define la contraseña.
export default function Restablecer() {
  const { db, modo, recargar } = useDatos();
  const router = useRouter();
  const [listo, setListo] = useState(false);
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [ver, setVer] = useState(false);

  useEffect(() => {
    if (modo === "demo") return;
    const supabase = supabaseNavegador();
    // Las invitaciones enviadas por el administrador llegan con la sesión en el
    // fragmento (#access_token=…). El cliente PKCE no lo lee solo, así que se
    // toma aquí; los enlaces de recuperación (?code=…) los procesa el cliente.
    const fragmento = new URLSearchParams(window.location.hash.slice(1));
    const access_token = fragmento.get("access_token");
    const refresh_token = fragmento.get("refresh_token");
    if (access_token && refresh_token) {
      window.history.replaceState(null, "", window.location.pathname);
      supabase.auth.setSession({ access_token, refresh_token }).then(({ data }) => setListo(!!data.session));
    } else {
      supabase.auth.getSession().then(({ data }) => setListo(!!data.session));
    }
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => setListo(!!sesion));
    return () => data.subscription.unsubscribe();
  }, [modo]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contrasena.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (contrasena !== confirmacion) return setError("Las contraseñas no coinciden.");
    if (modo === "demo") return setError("En la demostración no se guardan contraseñas.");
    setGuardando(true);
    const { error: fallo } = await supabaseNavegador().auth.updateUser({ password: contrasena });
    setGuardando(false);
    if (fallo) return setError("No se pudo guardar la contraseña. Pide un enlace nuevo.");
    await recargar();
    router.replace("/");
  };

  return (
    <PantallaAcceso
      nombre={db.configuracion.nombre}
      logoUrl={db.configuracion.logoUrl}
      titulo="Define tu contraseña"
      subtitulo="Usa al menos 8 caracteres."
      escena={<Escena />}
      // Noche más cerrada: casi negro arriba y azul profundo hacia el horizonte
      cielo="bg-[linear-gradient(to_bottom,#04060d_0%,#070c1a_55%,#0d1830_100%)]"
    >
      {modo !== "demo" && !listo ? (
        <p className="text-sm text-piedra-600">Validando el enlace… Si no avanza, el enlace pudo haber expirado: solicita uno nuevo desde la pantalla de inicio de sesión.</p>
      ) : (
        <form onSubmit={guardar} className="space-y-4">
          <Campo etiqueta="Nueva contraseña">
            <div className="relative">
              <Entrada type={ver ? "text" : "password"} autoComplete="new-password" className="pr-10" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
              <button
                type="button"
                aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-piedra-500 hover:text-piedra-900"
                onClick={() => setVer(!ver)}
              >
                {ver ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Campo>
          <Fuerza contrasena={contrasena} />
          <Campo etiqueta="Confirmar contraseña">
            <Entrada type={ver ? "text" : "password"} autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
          </Campo>
          {confirmacion && (
            <p className={`flex items-center gap-1.5 text-xs font-semibold ${contrasena === confirmacion ? "text-olivo-700" : "text-piedra-500"}`}>
              {contrasena === confirmacion ? <><Check size={14} /> Las contraseñas coinciden</> : "Todavía no coinciden"}
            </p>
          )}
          {error && <p className="bg-liston-50 px-3 py-2 text-sm text-liston-700">{error}</p>}
          <Boton type="submit" className="w-full py-2.5" disabled={guardando}>Guardar y entrar</Boton>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-marca-700 hover:underline">Volver a iniciar sesión</Link>
      </p>
    </PantallaAcceso>
  );
}

// Medidor de cuatro bloques: largo, número, mayúscula y símbolo o 12 caracteres
const NIVELES = [
  { texto: "Muy corta", color: "bg-liston-600" },
  { texto: "Débil", color: "bg-liston-600" },
  { texto: "Regular", color: "bg-dorado-500" },
  { texto: "Buena", color: "bg-olivo-500" },
  { texto: "Fuerte", color: "bg-olivo-600" },
];

function Fuerza({ contrasena }: { contrasena: string }) {
  if (!contrasena) return null;
  const puntos =
    contrasena.length < 8
      ? 0
      : 1 + Number(/\d/.test(contrasena)) + Number(/[A-ZÁÉÍÓÚÑ]/.test(contrasena)) + Number(/[^\wÁÉÍÓÚÑáéíóúñ]/.test(contrasena) || contrasena.length >= 12);
  const nivel = NIVELES[puntos];
  return (
    <div className="-mt-1 flex items-center gap-3">
      <div className="grid h-3 flex-1 grid-cols-4 gap-0.5 border border-piedra-900 bg-piedra-200 p-px" aria-hidden>
        {[1, 2, 3, 4].map((i) => <span key={i} className={i <= Math.max(puntos, 1) ? nivel.color : "bg-piedra-50"} />)}
      </div>
      <span className="w-20 text-right text-xs font-semibold text-piedra-600">{nivel.texto}</span>
    </div>
  );
}

// Interior de la iglesia con Vivian dentro y, abajo, su cuadro de diálogo con
// retrato, como en los videojuegos en pixel art
function Escena() {
  return (
    <div className="relative -mx-12 mt-auto xl:-mx-16">
      <div className="relative flex justify-center px-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- dibujo fijo, sin optimizar a propósito */}
        <img src="/pixel/restablecer.png" alt="" aria-hidden width={746} height={423} className="relative -mb-3 h-auto w-full max-w-[640px] select-none" />
        {/* Vivian, a su tamaño real en pixeles, parada en el pasillo frente al altar */}
        {/* eslint-disable-next-line @next/next/no-img-element -- sprite a tamaño exacto para que se vea nítido */}
        <img src="/pixel/yo.png" alt="" aria-hidden width={40} height={104} className="sprite absolute bottom-0 left-[38%] z-10 -mb-1" style={{ width: 40 }} />
      </div>
      {/* Pasto y, encima, el cuadro de diálogo */}
      <div aria-hidden className="h-44 border-t-4 border-olivo-300 bg-olivo-600">
        <div className="h-3 bg-olivo-500" />
      </div>
      <figure className="absolute inset-x-6 bottom-5 flex gap-4 border-4 border-double border-piedra-50 bg-marca-900/95 p-2 shadow-[3px_3px_0_0_var(--color-piedra-950)] xl:inset-x-10">
        <span className="shrink-0 border-2 border-piedra-50 bg-marca-800">
          {/* eslint-disable-next-line @next/next/no-img-element -- retrato a tamaño exacto (x3) para que se vea nítido */}
          <img src="/pixel/yo-retrato.png" alt="" aria-hidden width={108} height={108} className="sprite block" style={{ width: 108 }} />
        </span>
        <div className="flex-1 py-1 pr-4">
          <figcaption className="font-titulo text-lg font-semibold text-dorado-300">Vivian:</figcaption>
          <blockquote className="mt-1 pl-3 font-titulo text-xl font-medium text-white"><Escribir texto="Todo tiene solución." /></blockquote>
        </div>
      </figure>
    </div>
  );
}

// El texto aparece letra por letra, una sola vez, como en los diálogos de los
// videojuegos. Los lectores de pantalla reciben la frase completa desde el inicio.
function Escribir({ texto }: { texto: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setN(texto.length);
    let i = 0;
    let reloj: ReturnType<typeof setInterval>;
    const espera = setTimeout(() => {
      reloj = setInterval(() => {
        i++;
        setN(i);
        if (i >= texto.length) clearInterval(reloj);
      }, 60);
    }, 700);
    return () => { clearTimeout(espera); clearInterval(reloj); };
  }, [texto]);
  return (
    <>
      <span className="sr-only">{texto}</span>
      {/* Lo que falta se escribe invisible para que el cuadro no cambie de tamaño */}
      <span aria-hidden>{texto.slice(0, n)}<span className="invisible">{texto.slice(n)}</span></span>
    </>
  );
}
