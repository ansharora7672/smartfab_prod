// Import the type that defines what SEO metadata looks like
import type { Metadata } from "next";
// Import Google Fonts — Next.js downloads these at build time (faster than loading from Google)
import { Plus_Jakarta_Sans, Inter, Geist } from "next/font/google";
// Import our global CSS (Tailwind + custom colors)
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// Set up heading font — Plus Jakarta Sans
// "variable" creates a CSS variable we can use in Tailwind classes
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],               // Only load English characters (smaller file)
  variable: "--font-plus-jakarta",  // Creates CSS variable: var(--font-plus-jakarta)
  display: "swap",                  // Show fallback font while this loads
  weight: ["400", "500", "600", "700"], // Which weights to download
});

// Set up body font — Inter
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
});

// SEO METADATA — Next.js converts this into <title> and <meta> tags automatically
// This is what Google reads when it crawls the site
export const metadata: Metadata = {
  title: {
    default: "SMARTFAB LATHE",
    // "template" lets other pages set their own title
    // e.g., a page sets title = "About" → becomes "About | SmartFab Lathe"
    template: "%s | SMARTFAB LATHE",
  },
  description:
    "SmartFab Lathe offers CNC milling, turning, laser cutting, welding, and precision manufacturing services in Dubai. Engineering Accuracy. Crafted in metal. Get a quote today.",
  keywords: [
    "CNC milling Dubai",
    "manufacturing services Dubai",
    "laser cutting UAE",
    "precision manufacturing",
    "SmartFab Lathe",
  ],
  // OpenGraph = what shows when someone shares your link on WhatsApp, LinkedIn, etc.
  openGraph: {
    title: "SmartFab Lathe | Engineering Accuracy. Crafted in metal",
    description:
      "SmartFab Lathe offers CNC milling, turning, laser cutting, welding, and precision manufacturing services in Dubai. Engineering Accuracy. Crafted in metal. Get a quote today.",
    type: "website",
    locale: "en_AE",    // English - UAE
  },
};

// THE ACTUAL COMPONENT
// "children" = whatever page the user is currently viewing (home, about, etc.)
// This function wraps every page with the same <html> and <body> structure
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;  // TypeScript: "children can be any React content"
}>) {
  return (
    // We attach both font variables to <html> so all pages can use them
    <html lang="en" className={cn(plusJakartaSans.variable, inter.variable, "font-sans", geist.variable)}>
      {/* 
        font-inter = use Inter as default body font
        antialiased = makes text smoother on screens
        bg-white = white background
        text-slate-900 = very dark gray text (not pure black — easier on the eyes)
      */}
      <body className="font-inter antialiased bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}
