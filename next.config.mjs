/** @type {import('next').NextConfig} */
const nextConfig = {
  // viem/ox use dynamic require() in worker pool code — exclude from webpack bundling
  experimental: {
    serverComponentsExternalPackages: ["viem", "wagmi", "@farcaster/auth-kit", "@farcaster/frame-sdk"],
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.farcaster.xyz" },
      { protocol: "https", hostname: "**.warpcast.com" },
      { protocol: "https", hostname: "imagedelivery.net" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "i.imgur.com" },
    ],
  },

  webpack(config) {
    // Silence the "Critical dependency" warning from ox/viem worker pool
    config.module = config.module ?? {};
    config.module.exprContextCritical = false;
    return config;
  },

  async headers() {
    return [
      {
        source: "/.well-known/farcaster.json",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
};

export default nextConfig;
