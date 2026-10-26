"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDatos } from "@/lib/store";

export default function Raiz() {
  const { usuario } = useDatos();
  const router = useRouter();
  useEffect(() => {
    if (!usuario) router.replace("/login");
    else router.replace(usuario.rol === "miembro" ? "/inicio" : "/panel");
  }, [usuario, router]);
  return null;
}
