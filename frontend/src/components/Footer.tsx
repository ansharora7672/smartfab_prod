import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const quickLinks = [
    { label: "Services", href: "#services" },
    { label: "How It Works", href: "#process" },
    { label: "Get a Quote", href: "#quote" },
    { label: "Track Your Order", href: "#track" },
  ];

  return (
    <footer id="contact" className="bg-text-primary text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

          {/* Column 1 - Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/SmartFab_FinalLogo.png"
                alt="SmartFab Lathe"
                width={56}
                height={56}
                className="object-contain"

              />
              <div className="flex flex-col leading-none">
                <span className="font-heading font-bold text-base tracking-[0.2em]">
                  SMARTFAB
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="block w-4 h-px bg-white/30" />
                  <span className="font-heading font-semibold text-[10px] tracking-[0.3em] text-white/70">
                    LATHE
                  </span>
                  <span className="block w-4 h-px bg-white/30" />
                </div>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Precision manufacturing services for industries across the UAE.
              Engineering accuracy, crafted in metal.
            </p>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-sm uppercase tracking-widest text-white/70 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Contact */}
          <div>
            <h4 className="font-heading font-semibold text-sm uppercase tracking-widest text-white/70 mb-4">
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary-100 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/50">
                  Industrial 2, Ajman, United Arab Emirates
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary-100 flex-shrink-0" />
                <a href="tel:+971542133637" className="text-sm text-white/50 hover:text-white transition-colors duration-300">
                  +971 542133637
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary-100 flex-shrink-0" />
                <a href="tel:+971553610905" className="text-sm text-white/50 hover:text-white transition-colors duration-300">
                  +971 553610905
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary-100 flex-shrink-0" />
                <a href="mailto:lathe.smartfab@gmail.com" className="text-sm text-white/50 hover:text-white transition-colors duration-300">
                  lathe.smartfab@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <p className="text-center text-xs text-white/30">
            &copy; {new Date().getFullYear()} SmartFab Lathe. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
