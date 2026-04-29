import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

      <Image
        src="/images/hero-bg.png"
        alt="CNC machining in action"
        fill
        priority
        className="object-cover"
        quality={90}
      />

      {/* Cinematic overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-[#080C14]/90 via-text-primary/80 to-primary-900/75" />

      {/* Subtle left-side light bloom */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_20%_50%,rgba(37,99,235,0.12),transparent)]" />

      {/* Bottom fade merges seamlessly into the dark stats strip below */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-text-primary to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-24 text-center">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-3 mb-8">
          <span className="block w-8 h-px bg-white/20" />
          <span className="text-[11px] font-semibold tracking-[0.3em] uppercase text-white/40">
            Precision Manufacturing · UAE
          </span>
          <span className="block w-8 h-px bg-white/20" />
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.08] mb-6">
          Engineering Accuracy.
          <br />
          <span className="text-primary-100">Crafted in Metal.</span>
        </h1>

        <p className="text-lg md:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed mb-10">
          Precision manufacturing services for industries across the UAE.
          From concept to delivery, we bring your designs to life.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#quote"
            className="w-full sm:w-auto text-center bg-primary-600 text-white px-9 py-3.5 rounded-lg font-semibold text-sm tracking-wide transition-all duration-300 hover:bg-white hover:text-primary-900"
          >
            Get a Quote
          </a>
          <a
            href="#track"
            className="w-full sm:w-auto text-center border border-white/20 text-white/75 px-9 py-3.5 rounded-lg font-semibold text-sm tracking-wide transition-all duration-300 hover:border-white/45 hover:text-white"
          >
            Track Your Order
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#stats"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 animate-bounce cursor-pointer"
      >
        <svg className="w-5 h-5 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </a>
    </section>
  );
}
