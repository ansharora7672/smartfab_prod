"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

// ============================================================
// NAVBAR COMPONENT
// ============================================================

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  // STATE: track if mobile menu is open
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // EFFECT: listen for scroll events to toggle navbar style
  // useEffect runs code AFTER the component renders
  // The [] at the end means "run once when component first appears"
  useEffect(() => {
    const handleScroll = () => {
      // If user scrolls more than 50px down, switch to solid navbar
      setIsScrolled(window.scrollY > 50);
    };

    // Add the scroll listener
    window.addEventListener("scroll", handleScroll);

    // Cleanup: remove listener when component unmounts (prevents memory leaks)
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation links — defined as data so we can loop over them
  const navLinks = [
  { label: "Services", href: "#services" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
];


  return (
    // HEADER: the navbar container
    // - fixed → stays at top even when scrolling
    // - top-0 left-0 right-0 → spans full width at the very top
    // - z-50 → sits ABOVE everything else (z-index = layering order)
    // - transition-all duration-500 → smooth 500ms transition when style changes
    // - backdrop-blur-md → glass blur effect when scrolled
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-[0_1px_0_0_#CBD5E1]"
          : "bg-transparent"
      }`}
    >
      {/* 
        Inner container:
        - max-w-7xl → max width 1280px (keeps content centered, not stretched on ultrawide monitors)
        - mx-auto → center horizontally
        - px-6 → 24px padding left/right
        - py-4 → 16px padding top/bottom
        - flex items-center justify-between → horizontal layout, vertically centered, space between
      */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-0">
          {/* 
            next/image → Next.js optimized image component
            - Automatically lazy-loads (only loads when visible)
            - Serves WebP format (smaller file)
            - Prevents layout shift with width/height
          */}
          <Image
            src="/SmartFab_FinalLogo_version.png"
            alt="SmartFab Lathe"
            width={80}
            height={80}
            className="object-contain"
          />
          <div className="flex flex-col items-start leading-none">
  <span
    className={`font-heading font-bold text-base tracking-[0.2em] transition-colors duration-500 ${
      isScrolled ? "text-primary-900" : "text-white"
    }`}
  >
    SMARTFAB
  </span>
  <div className="flex items-center gap-2 mt-0.5">
    <span
      className={`block w-4 h-px transition-colors duration-500 ${
        isScrolled ? "bg-primary-600" : "bg-white/50"
      }`}
    />
    <span
      className={`font-heading font-semibold text-[10px] tracking-[0.3em] transition-colors duration-500 ${
        isScrolled ? "text-primary-600" : "text-white/70"
      }`}
    >
      LATHE
    </span>
    <span
      className={`block w-4 h-px transition-colors duration-500 ${
        isScrolled ? "bg-primary-600" : "bg-white/50"
      }`}
    />
  </div>
</div>

        </Link>

        {/* DESKTOP NAV LINKS — hidden on mobile (hidden md:flex) */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`text-sm font-medium transition-colors duration-500 hover:text-primary-600 ${
                isScrolled ? "text-text-secondary" : "text-white/80"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA BUTTONS — hidden on mobile */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#track"
            className={`text-sm font-medium px-5 py-2 rounded-xl border transition-all duration-500 ${
              isScrolled
                ? "border-border text-text-primary hover:bg-section-bg"
                : "border-white/30 text-white hover:bg-white/10"
            }`}
          >
            Track Your Order
          </a>
<Link
              href="/quote"
              className="text-sm font-medium px-5 py-2 rounded-xl bg-primary-600 text-white text-center hover:bg-primary-900 transition-all duration-500"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Get a Quote
            </Link>
        </div>

        {/* MOBILE HAMBURGER BUTTON — visible only on small screens (md:hidden) */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {/* Three lines that make the hamburger icon */}
          <span
            className={`block w-6 h-0.5 transition-all duration-300 ${
              isScrolled ? "bg-text-primary" : "bg-white"
            }`}
          />
          <span
            className={`block w-6 h-0.5 transition-all duration-300 ${
              isScrolled ? "bg-text-primary" : "bg-white"
            }`}
          />
          <span
            className={`block w-6 h-0.5 transition-all duration-300 ${
              isScrolled ? "bg-text-primary" : "bg-white"
            }`}
          />
        </button>
      </div>

      {/* MOBILE MENU — slides down when hamburger is clicked */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-border px-6 py-4 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block text-sm font-medium text-text-secondary hover:text-primary-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <a
              href="#track"
              className="text-sm font-medium px-5 py-2 rounded-xl border border-border text-text-primary text-center hover:bg-section-bg transition-all duration-500"
            >
              Track Your Order
            </a>
            <a
              href="#quote"
              className="text-sm font-medium px-5 py-2 rounded-xl bg-primary-600 text-white text-center hover:bg-primary-900 transition-all duration-500"
            >
              Get a Quote
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
