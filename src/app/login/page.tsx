"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { Boton, Campo, Entrada, Tarjeta } from "@/components/ui";
import { nombreRol } from "@/lib/catalogos";
import { useDatos } from "@/lib/store";

export default function Login() {
  const { db, modo, usuario, entrar, entrarDemo, recuperar } = useDatos();
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Con sesión iniciada se pasa directo a la aplicación
  useEffect(() => {
    if (usuario) router.replace(usuario.rol === "miembro" ? "/inicio" : "/panel");
  }, [usuario, router]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError((await entrar(correo, contrasena)) ?? "");
    setEnviando(false);
  };

  const pedirEnlace = async () => {
    if (!correo.trim()) return;
    setEnviando(true);
    const fallo = await recuperar(correo);
    setEnviando(false);
    if (fallo) setError(fallo);
    else setEnviado(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3"><Logo url={db.configuracion.logoUrl} tamano={48} /></div>
          <h1 className="text-xl font-semibold">{db.configuracion.nombre}</h1>
          <p className="text-sm text-slate-500">Sistema de gestión de iglesias</p>
        </div>

        <Tarjeta className="p-6">
          {!recuperando ? (
            <form onSubmit={enviar} className="space-y-4">
              <Campo etiqueta="Correo electrónico">
                <Entrada type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre@correo.mx" />
              </Campo>
              <Campo etiqueta="Contraseña">
                <Entrada type="password" autoComplete="current-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
              </Campo>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Boton type="submit" className="w-full" disabled={enviando}>{enviando ? "Entrando…" : "Iniciar sesión"}</Boton>
              <button type="button" onClick={() => { setRecuperando(true); setError(""); }} className="w-full text-center text-sm text-indigo-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Escribe tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <Campo etiqueta="Correo electrónico">
                <Entrada type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
              </Campo>
              {enviado && <p className="text-sm text-emerald-600">Si el correo está registrado, recibirás el enlace en unos minutos.</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Boton variante="secundario" onClick={() => { setRecuperando(false); setEnviado(false); setError(""); }}>Volver</Boton>
                <Boton className="flex-1" disabled={enviando} onClick={pedirEnlace}>Enviar enlace</Boton>
              </div>
            </div>
          )}
        </Tarjeta>

        {modo === "demo" && (
          <Tarjeta className="p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
              Modo demostración: entrar con un rol
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {db.usuarios.map((u) => (
                <Boton key={u.id} variante="secundario" onClick={() => entrarDemo(u.id)}>
                  {nombreRol(u.rol)}
                </Boton>
              ))}
            </div>
          </Tarjeta>
        )}
      </div>
    </div>
  );
}
