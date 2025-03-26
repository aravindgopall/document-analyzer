import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    env: {
    NEXT_AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
    NEXT_AZURE_OPENAI_KEY: process.env.AZURE_OPENAI_KEY,
    NEXT_AZURE_OPENAI_DEPLOYMENT: process.env.AZURE_OPENAI_DEPLOYMENT,
  },
  /* config options here */
};

export default nextConfig;
