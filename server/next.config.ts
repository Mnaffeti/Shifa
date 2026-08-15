import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * CORS is handled in `proxy.ts`, not here: credentialed requests need one
 * exact origin echoed back per request, which static headers can't express.
 */
const nextConfig: NextConfig = {
  /**
   * This app is nested inside a repo whose root holds the Vite frontend and
   * its own package-lock.json. Turbopack walks upward looking for a lockfile
   * and would otherwise pick the repo root as the workspace root, which makes
   * module resolution ambiguous. Pin it to this directory.
   */
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
