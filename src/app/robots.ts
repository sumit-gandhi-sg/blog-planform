import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const appUrl = getBaseUrl();

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
