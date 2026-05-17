"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Services", href: "#services" },
    { label: "Process", href: "#process" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-[#080C14]/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(255,255,255,0.07)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo — always white since site is dark-themed */}
        <Link href="/" className="flex items-center gap-0">
          <Image
            src="/SmartFab_FinalLogo.png"
            alt="SmartFab Lathe"
            width={100}
            height={100}
            className="object-contain"
          />
          <div className="flex flex-col items-center leading-none">
            <span className="font-heading font-bold text-base tracking-[0.2em] text-white">
              SMARTFAB
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="block w-4 h-px bg-white/40" />
              <span className="font-heading font-semibold text-[10px] tracking-[0.3em] text-white">
                LATHE
              </span>
              <span className="block w-4 h-px bg-white/40" />
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-white/65 hover:text-white transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#track"
            className="text-sm font-medium px-5 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 hover:border-white/40 hover:text-white transition-all duration-300"
          >
            Track Your Order
          </a>
          <Link
            href="/quote"
            className="text-sm font-medium px-5 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-500 transition-all duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Get a Quote
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="block w-6 h-0.5 bg-white" />
          <span className="block w-6 h-0.5 bg-white" />
          <span className="block w-6 h-0.5 bg-white" />
        </button>
      </div>

      {/* Mobile menu — dark to match site theme */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#080C14] border-t border-white/10 px-6 py-5 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block text-sm font-medium text-white/60 hover:text-white transition-colors duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <a
              href="#track"
              className="text-sm font-medium px-5 py-2.5 rounded-lg border border-white/20 text-white/70 text-center hover:bg-white/10 transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Track Your Order
            </a>
            <Link
              href="/quote"
              className="text-sm font-medium px-5 py-2.5 rounded-lg bg-primary-600 text-white text-center hover:bg-primary-500 transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Get a Quote
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
