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
  async headers() {
    const assets = "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800";
    return [
      {
        source: "/:dir(products|images|icons|category-icons|custom-cakes|homepage-banners|homepage-banners-v2|general-aisles|bakery-aisles|beverage-aisles|sweets-aisles)/:path*",
        headers: [{ key: "Cache-Control", value: assets }],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/returns", destination: "/return-policy", permanent: true },
      { source: "/shipping-policy", destination: "/return-policy", permanent: true },
      { source: "/delivery", destination: "/visit", permanent: true },
      {
        source: "/refund-policy",
        destination: "/return-policy",
        permanent: true,
      },
      {
        source: "/baby-celebrations",
        destination: "/celebrations",
        permanent: true,
      },
      {
        source: "/baby-celebrations/:path*",
        destination: "/celebrations/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
