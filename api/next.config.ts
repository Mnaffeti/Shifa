import type { NextConfig } from 'next';

/**
 * CORS is handled in `proxy.ts`, not here: credentialed requests need one
 * exact origin echoed back per request, which static headers can't express.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
