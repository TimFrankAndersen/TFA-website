import type { MetadataRoute } from "next";

/**
 * Robots policy: welcome all crawlers - including AI assistants (GPTBot,
 * ClaudeBot, PerplexityBot etc.), which is a deliberate choice: Tim wants
 * to be findable and quotable by generative engines. The private dashboard
 * and API routes are kept out.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api/", "/welcome"],
      },
    ],
    sitemap: "https://www.timfrankandersen.com/sitemap.xml",
  };
}
