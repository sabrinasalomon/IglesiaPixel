"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { Boton, Campo, Entrada, Tarjeta } from "@/components/ui";
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
    setGuardando(true);
    const { error: fallo } = await supabaseNavegador().auth.updateUser({ password: contrasena });
    setGuardando(false);
    if (fallo) return setError("No se pudo guardar la contraseña. Pide un enlace nuevo.");
    await recargar();
    router.replace("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3"><Logo url={db.configuracion.logoUrl} tamano={48} /></div>
          <h1 className="text-xl font-semibold">Define tu contraseña</h1>
        </div>
        <Tarjeta className="p-6">
          {modo === "demo" ? (
            <p className="text-sm text-slate-600">Esta página se usa con Supabase configurado.</p>
          ) : !listo ? (
            <p className="text-sm text-slate-600">Validando el enlace… Si no avanza, el enlace pudo haber expirado: solicita uno nuevo desde la pantalla de inicio de sesión.</p>
          ) : (
            <form onSubmit={guardar} className="space-y-4">
              <Campo etiqueta="Nueva contraseña">
                <Entrada type="password" autoComplete="new-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
              </Campo>
              <Campo etiqueta="Confirmar contraseña">
                <Entrada type="password" autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
              </Campo>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Boton type="submit" className="w-full" disabled={guardando}>Guardar y entrar</Boton>
            </form>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
