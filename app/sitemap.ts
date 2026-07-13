import type { MetadataRoute } from "next";

const BASE = "https://www.timfrankandersen.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/speaking`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/news`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/curriculum`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/predictions`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
