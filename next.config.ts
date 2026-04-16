import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  // This tells Turbopack to stay away from pdf-parse
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;