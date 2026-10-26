/* eslint-disable @next/next/no-img-element -- el logo viene de Supabase Storage o de un archivo local */
import { Church } from "lucide-react";

export function Logo({ url, tamano = 36 }: { url?: string | null; tamano?: number }) {
  if (url) {
    return <img src={url} alt="Logotipo" width={tamano} height={tamano} className="rounded-lg object-cover" style={{ width: tamano, height: tamano }} />;
  }
  return (
    <span className="flex items-center justify-center rounded-lg bg-indigo-600 text-white" style={{ width: tamano, height: tamano }}>
      <Church size={tamano * 0.55} />
    </span>
  );
}
