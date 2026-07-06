import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Preserve Google history from the old Squarespace site.
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/contact", destination: "/speaking", permanent: true },
      { source: "/podcast", destination: "/about", permanent: true },
      { source: "/live", destination: "/speaking", permanent: true },
      {
        source: "/old-ten-tech-predictions",
        destination: "/predictions",
        permanent: true,
      },
      {
        source: "/ten-tech-predictions-:year",
        destination: "/predictions",
        permanent: true,
      },
      {
        source: "/ten-tech-predictions-:year/:slug",
        destination: "/predictions",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
