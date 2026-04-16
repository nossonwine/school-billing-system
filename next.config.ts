import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Blindfold Turbopack so it doesn't look inside the PDF tool OR look for canvas
  serverExternalPackages: ["canvas", "pdfjs-dist"],
};

export default nextConfig;