import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The BFF proxy (`app/api/proxy/[...path]`) forwards to a Django REST API that
  // requires trailing slashes. Without this, Next 308-redirects `/api/proxy/x/`
  // to `/api/proxy/x` before the handler runs, adding a hop on every call.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
