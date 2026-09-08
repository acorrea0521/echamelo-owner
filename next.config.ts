import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve images as-is rather than through the on-the-fly optimizer, so the
  // host doesn't need `sharp` / extra CPU.
  images: { unoptimized: true },

  // The app is deployed to cPanel (GoDaddy) as a self-contained bundle started
  // by Passenger through `server.js` — that file only exists with standalone
  // output, and DEPLOY-CPANEL.md's "Updating the app later" already assumes it.
  // It used to be off because the Railway deployment ran `next start`, which
  // standalone does not support; that deployment is gone.
  //
  // Consequence worth knowing: `npm start` no longer works locally. Run the
  // production build with `node .next/standalone/server.js` instead. `npm run
  // dev` is unaffected.
  output: "standalone",
};

export default nextConfig;
