/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // TypeScript errors now BLOCK the build. All routes, lib modules, and
  // utilities are fully type-checked. The single exception is
  // components/PlansparencyApp.tsx, which carries a file-level @ts-nocheck
  // while it awaits incremental typing/decomposition.
  typescript: {
    ignoreBuildErrors: false,
  },
  // No ESLint config is present in this project, so the build lint step is a
  // no-op; left disabled to avoid Next attempting (and failing) to lint
  // without a configuration.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
