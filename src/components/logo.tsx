/* eslint-disable @next/next/no-img-element -- el logo viene de Supabase Storage o de un archivo local */
import { Church } from "lucide-react";

export function Logo({ url, tamano = 36 }: { url?: string | null; tamano?: number }) {
  if (url) {
    return <img src={url} alt="Logotipo" width={tamano} height={tamano} className="rounded-xl object-cover" style={{ width: tamano, height: tamano }} />;
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-dorado-300 to-dorado-500 text-marca-950 shadow-sm shadow-dorado-700/30 ring-1 ring-inset ring-white/30"
      style={{ width: tamano, height: tamano }}
    >
      <Church size={tamano * 0.55} />
    </span>
  );
}
