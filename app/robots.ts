import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/dashboard/"],
      },
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
