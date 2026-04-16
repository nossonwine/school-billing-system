import type { NextConfig } from "next";

export default {
  // This tells Vercel's builder to completely ignore the missing 'canvas' tool
  serverExternalPackages: ["canvas"],
} as NextConfig;