/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.farcaster.xyz" },
      { protocol: "https", hostname: "**.warpcast.com" },
      { protocol: "https", hostname: "imagedelivery.net" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "i.imgur.com" },
    ],
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
