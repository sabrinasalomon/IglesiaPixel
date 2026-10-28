/* eslint-disable @next/next/no-img-element -- el logo viene de Supabase Storage o de un archivo local */

// Sin logo propio se muestra la iglesia en pixel art
export function Logo({ url, tamano = 36, claro = false }: { url?: string | null; tamano?: number; claro?: boolean }) {
  if (url) {
    return <img src={url} alt="Logotipo" width={tamano} height={tamano} className="object-cover" style={{ width: tamano, height: tamano }} />;
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center border-2 ${claro ? "border-marca-300 bg-marca-900" : "border-piedra-900 bg-marca-800"}`}
      style={{ width: tamano, height: tamano }}
    >
      <img src="/pixel/iglesia.png" alt="" aria-hidden className="sprite" style={{ width: tamano * 0.78, height: "auto" }} />
    </span>
  );
}
