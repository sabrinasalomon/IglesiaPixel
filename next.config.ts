import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El indicador de desarrollo tapaba la tarjeta del usuario en el menú lateral
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
