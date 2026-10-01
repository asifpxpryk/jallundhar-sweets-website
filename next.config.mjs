/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Product and banner assets are already compressed. Serve them directly to
    // avoid spending Vercel Image Optimization transformations on each variant.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 1080, 1200],
    imageSizes: [640],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
