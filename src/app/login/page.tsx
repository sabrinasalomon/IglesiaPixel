"use client";

import { Church } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Boton, Campo, Entrada, Tarjeta } from "@/components/ui";
import { nombreRol } from "@/lib/catalogos";
import { useDatos } from "@/lib/store";

export default function Login() {
  const { db, iniciarSesion } = useDatos();
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [recuperar, setRecuperar] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const entrarComo = (usuarioId: string) => {
    const u = db.usuarios.find((x) => x.id === usuarioId)!;
    iniciarSesion(u.id);
    router.push(u.rol === "miembro" ? "/inicio" : "/panel");
  };

  // En el prototipo cualquier contraseña es válida para los correos de demostración
  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const u = db.usuarios.find((x) => x.correo === correo.trim().toLowerCase());
    if (!u || !contrasena) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    entrarComo(u.id);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Church size={26} />
          </div>
          <h1 className="text-xl font-semibold">{db.configuracion.nombre}</h1>
          <p className="text-sm text-slate-500">Sistema de gestión de iglesias</p>
        </div>

        <Tarjeta className="p-6">
          {!recuperar ? (
            <form onSubmit={enviar} className="space-y-4">
              <Campo etiqueta="Correo electrónico">
                <Entrada type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre@correo.mx" />
              </Campo>
              <Campo etiqueta="Contraseña">
                <Entrada type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
              </Campo>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Boton type="submit" className="w-full">Iniciar sesión</Boton>
              <button type="button" onClick={() => setRecuperar(true)} className="w-full text-center text-sm text-indigo-600 hover:underline">
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
              {enviado && <p className="text-sm text-emerald-600">Si el correo existe, recibirás el enlace en unos minutos.</p>}
              <div className="flex gap-2">
                <Boton variante="secundario" onClick={() => { setRecuperar(false); setEnviado(false); }}>Volver</Boton>
                <Boton className="flex-1" onClick={() => setEnviado(true)}>Enviar enlace</Boton>
              </div>
            </div>
          )}
        </Tarjeta>

        <Tarjeta className="p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            Prototipo: entrar con un rol de demostración
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {db.usuarios.map((u) => (
              <Boton key={u.id} variante="secundario" onClick={() => entrarComo(u.id)}>
                {nombreRol(u.rol)}
              </Boton>
            ))}
          </div>
        </Tarjeta>
      </div>
    </div>
  );
}
