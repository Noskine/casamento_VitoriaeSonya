import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'referable-gander-yesterday.ngrok-free.dev',
    'vitoriaesonay.site',
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        'vitoriaesonay.site',
        'www.vitoriaesonay.site',
        'referable-gander-yesterday.ngrok-free.dev',
      ],
    },
  },
};

export default nextConfig;