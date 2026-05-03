/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep pdf-parse as an external package so Next.js doesn't bundle it
  // and the canvas/DOMMatrix polyfill errors are avoided
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
