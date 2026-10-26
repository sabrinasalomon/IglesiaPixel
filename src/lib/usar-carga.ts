"use client";

import { useCallback, useEffect, useState } from "react";

// Carga datos con una función asíncrona y permite volver a cargarlos tras un cambio
export function useCarga<T>(cargar: () => Promise<T>, inicial: T) {
  const [datos, setDatos] = useState<T>(inicial);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const recargar = useCallback(async () => {
    try {
      setDatos(await cargar());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los datos.");
    } finally {
      setCargando(false);
    }
  }, [cargar]);

  useEffect(() => {
    setCargando(true);
    recargar();
  }, [recargar]);

  return { datos, cargando, error, recargar };
}

// Ejecuta una acción y devuelve el mensaje de error, si lo hubo
export async function intentar(accion: () => Promise<unknown>): Promise<string> {
  try {
    await accion();
    return "";
  } catch (e) {
    return e instanceof Error ? e.message : "Ocurrió un error inesperado.";
  }
}
