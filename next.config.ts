import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve images as-is rather than through the on-the-fly optimizer, so the
  // host doesn't need `sharp` / extra CPU. (No `output: standalone` here —
  // Railway runs the app with `next start`, which conflicts with standalone.)
  images: { unoptimized: true },
};

export default nextConfig;
