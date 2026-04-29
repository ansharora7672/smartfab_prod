import { Upload, Users, Settings, PackageCheck } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const steps = [
  {
    Icon: Upload,
    step: "01",
    title: "Share Your Requirements",
    description:
      "Tell us what you need manufactured. Share engineering drawings, specs, or simply describe your project. Our team responds within 24 hours.",
  },
  {
    Icon: Users,
    step: "02",
    title: "Consult With Our Team",
    description:
      "We schedule a consultation to discuss materials, tolerances, timeline, and pricing. No obligation, just clarity.",
  },
  {
    Icon: Settings,
    step: "03",
    title: "Precision Manufacturing",
    description:
      "Our team brings your designs to life using state-of-the-art CNC equipment and rigorous quality control at every stage.",
  },
  {
    Icon: PackageCheck,
    step: "04",
    title: "Quality Delivery",
    description:
      "Every piece is inspected, packaged, and delivered to your door. Track your order in real time from our portal.",
  },
];

export default function Process() {
  return (
    <section id="process" className="py-24 bg-[#111827]">

      <div className="max-w-7xl mx-auto px-6">

        <ScrollReveal>
          <div className="mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary-400 mb-4">
              How It Works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white max-w-sm leading-tight">
              From inquiry to delivery.
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {steps.map(({ Icon, step, title, description }, index) => (
            <ScrollReveal key={step} delay={index * 100} direction="up">
              <div className="group relative rounded-2xl p-8 md:p-9 border border-white/10 hover:border-primary-500/40 bg-white/5 hover:bg-white/8 transition-all duration-500 overflow-hidden">

                {/* Faint step number watermark */}
                <span
                  aria-hidden
                  className="absolute -right-2 -bottom-3 text-[100px] font-bold font-heading leading-none select-none pointer-events-none text-white/4 group-hover:text-white/6 transition-colors duration-500"
                >
                  {step}
                </span>

                {/* Icon */}
                <div className="w-11 h-11 rounded-xl bg-primary-600/20 flex items-center justify-center group-hover:bg-primary-600 transition-colors duration-500 mb-6">
                  <Icon className="w-5 h-5 text-primary-400 group-hover:text-white transition-colors duration-500" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 leading-snug">
                  {title}
                </h3>
                <p className="text-sm text-white/45 leading-relaxed">
                  {description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
