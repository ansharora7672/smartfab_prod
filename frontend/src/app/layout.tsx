import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
});

const SITE_URL = "https://smartfablathe.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SmartFab Lathe | CNC Precision Manufacturing Dubai",
    template: "%s | SmartFab Lathe",
  },
  description:
    "SmartFab Lathe offers CNC milling, turning, laser cutting, welding, and precision manufacturing services in Dubai & UAE. Engineering Accuracy. Crafted in metal. Get a quote today.",
  keywords: [
    "CNC milling Dubai",
    "CNC turning UAE",
    "laser cutting Dubai",
    "precision manufacturing UAE",
    "welding services Dubai",
    "SmartFab Lathe",
    "metal fabrication Ajman",
    "industrial manufacturing UAE",
  ],
  authors: [{ name: "SmartFab Lathe", url: SITE_URL }],
  creator: "SmartFab Lathe",
  publisher: "SmartFab Lathe",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "SmartFab Lathe | Engineering Accuracy. Crafted in Metal.",
    description:
      "CNC milling, turning, laser cutting, welding, and precision manufacturing services in Dubai & UAE. Get a quote today.",
    type: "website",
    locale: "en_AE",
    url: SITE_URL,
    siteName: "SmartFab Lathe",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SmartFab Lathe — Precision Manufacturing Dubai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartFab Lathe | Engineering Accuracy. Crafted in Metal.",
    description:
      "CNC milling, turning, laser cutting, welding, and precision manufacturing services in Dubai & UAE.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html
      lang="en"
      className={cn(
        plusJakartaSans.variable,
        inter.variable,
        "font-sans",
        geist.variable
      )}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-inter antialiased bg-white text-slate-900">
        {children}

        {gaMeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
