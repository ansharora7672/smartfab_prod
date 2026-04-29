import Image from "next/image";
import ScrollReveal from "./ScrollReveal";

const categories = [
  {
    id: "01",
    title: "CNC & Machining",
    tagline: "Micron-level precision on every run, every material.",
    count: "5 Services",
    services: ["CNC Milling", "CNC Turning", "Laser Cutting", "EDM Wire Cutting", "EDM Sparking"],
  },
  {
    id: "02",
    title: "Welding",
    tagline: "Structural integrity for the most demanding applications.",
    count: "3 Services",
    services: ["MIG Welding", "TIG Welding", "Arc Welding"],
  },
  {
    id: "03",
    title: "Fabrication & Production",
    tagline: "From individual tooling to high-volume production runs.",
    count: "4 Services",
    services: [
      "Gear Cutting",
      "Bending",
      "Tool & Part Manufacturing",
      "High Production Manufacturing",
    ],
  },
];

export default function Services() {
  return (
    <section id="services" className="relative py-24 overflow-hidden">

      {/* Real manufacturing background image */}
      <Image
        src="/images/services-bg.png"
        alt="Manufacturing floor"
        fill
        className="object-cover"
        quality={85}
      />

      {/* Heavy dark overlay so text is readable */}
      <div className="absolute inset-0 bg-text-primary/90" />

      {/* Subtle blue depth gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(37,99,235,0.1),transparent)]" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6">

        <ScrollReveal>
          <div className="mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary-400 mb-4">
              What We Do
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white max-w-xl leading-tight">
              Manufacturing excellence across every discipline.
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {categories.map((cat, i) => (
            <ScrollReveal key={cat.id} delay={i * 120} direction="up">
              {/* pb-20 reserves 80px at the bottom for the watermark zone — service list never enters it */}
              <div className="group relative rounded-2xl px-8 pt-8 pb-20 overflow-hidden cursor-default border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/8 transition-all duration-500">

                {/* Word watermark — anchored to extreme bottom-right, lives inside the pb-20 zone */}
                <span
                  aria-hidden
                  className="absolute bottom-4 right-6 text-[44px] font-bold font-heading leading-none select-none pointer-events-none text-white/8 uppercase tracking-widest"
                >
                  {cat.title.split(" ")[0]}
                </span>

                {/* Service count badge */}
                <span className="inline-flex self-start text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 border border-white/25 bg-white/10 px-3 py-1 rounded-full mb-6">
                  {cat.count}
                </span>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3 leading-snug">
                  {cat.title}
                </h3>

                {/* Tagline */}
                <p className="text-sm text-white/45 leading-relaxed mb-8">
                  {cat.tagline}
                </p>

                {/* Services list */}
                <ul className="space-y-2.5">
                  {cat.services.map((service) => (
                    <li key={service} className="flex items-center gap-3">
                      <span className="w-1 h-1 rounded-full bg-primary-400 shrink-0" />
                      <span className="text-sm text-white/55 group-hover:text-white/70 transition-colors duration-300">
                        {service}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
