import type { NextConfig } from "next";

/**
 * Reads a comma-separated list of LAN hosts from `NEXT_DEV_ORIGINS`.
 * Required when accessing the dev server from another device (e.g. phone)
 * over the local network — Next.js otherwise blocks cross-origin HMR.
 *
 * Example .env entry:
 *   NEXT_DEV_ORIGINS=192.168.1.10,172.20.10.2
 */
const allowedDevOrigins = (process.env.NEXT_DEV_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  allowedDevOrigins,
};

export default nextConfig;
