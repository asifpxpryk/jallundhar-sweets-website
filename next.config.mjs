/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Catalog, icons, and UI images set unoptimized on the component.
    // Only PromoBanner (ghee) uses the Image Optimization API.
    // Keep widths few so one banner cannot mint many transformation variants.
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
