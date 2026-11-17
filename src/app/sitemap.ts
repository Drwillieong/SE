import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { const base = process.env.SITE_URL ?? "https://washitizzy.com"; return ["", "/login", "/signup"].map((path) => ({ url: `${base}${path}`, lastModified: new Date() })); }
