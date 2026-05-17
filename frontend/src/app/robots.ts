import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/lpo-submit/",
          "/quote-response/",
          "/api/",
        ],
      },
    ],
    sitemap: "https://smartfablathe.com/sitemap.xml",
    host: "https://smartfablathe.com",
  };
}
