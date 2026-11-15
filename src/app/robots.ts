import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://inkwell.blog");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blogs", "/blogs/*"],
        disallow: ["/api/", "/my-blogs", "/write"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
