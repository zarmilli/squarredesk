/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  basePath: isProd ? "/Crypgo" : "",
  assetPrefix: isProd ? "/Crypgo/" : "",
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

 